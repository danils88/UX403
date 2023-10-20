//@ui5-bundle autoregistromedico/Component-preload.js
sap.ui.require.preload({
    "autoregistromedico/Component.js": function() {
        sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/Device", "autoregistromedico/model/models"], function(e, t, i) {
            "use strict";
            return e.extend("autoregistromedico.Component", {
                metadata: {
                    manifest: "json"
                },
                init: function() {
                    e.prototype.init.apply(this, arguments);
                    this.getRouter().initialize();
                    this.setModel(i.createDeviceModel(), "device")
                }
            })
        });
    },
    "autoregistromedico/controller/App.controller.js": function() {
        sap.ui.define(["sap/ui/core/mvc/Controller"], function(e) {
            "use strict";
            return e.extend("autoregistromedico.controller.App", {
                onInit() {}
            })
        });
    },
    "autoregistromedico/controller/Main.controller.js": function() {
        sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/Dialog", "sap/m/Button", "sap/m/library", "sap/m/Text", "sap/m/MessageBox", "sap/m/BusyDialog"], function(e, t, a, i, o, l, n) {
            "use strict";
            var r = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZISH_REMPE_SRV/");
            var s = i.ButtonType;
            var u = i.DialogType;
            return e.extend("autoregistromedico.controller.Main", {
                onInit: function() {
                    sap.ui.core.BusyIndicator.show(0);
                    this.getView().setModel(new sap.ui.model.json.JSONModel({}), "DataModel");
                    this.f_loadSpecialities();
                    this.f_loadFormModel()
                },
                f_loadSpecialities: function() {
                    var e = this;
                    r.read("/SpecialitiesSet", {
                        success: function(t) {
							//e.getView().setModel(new sap.ui.model.json.JSONModel({
							//	SpecialitiesSet: t.results
							//}), "DataModel")
							e.getView().getModel("DataModel").setProperty("/SpecialitiesSet", t.results)
						},
						error: function(e) {}
                    })
                },
                f_loadFormModel: function() {
                    var e = this;
                    r.read("/MedicalRegistrationSet?$expand=MedicalToSpecialityNAV", {
                        success: function(t) {
                            var a = t.results[0].MedicalToSpecialityNAV.results;
                            var i = [];
                            a.forEach(e => {
                                i.push(e.Speciality)
                            });
                            var o = new sap.ui.model.json.JSONModel({
                                IdCollegiate: t.results[0].IdCollegiate,
                                Name: t.results[0].Name,
                                Surname1: t.results[0].Surname1,
                                Surname2: t.results[0].Surname2,
                                PersonalId: t.results[0].PersonalId,
                                Email: t.results[0].Email,
                                Gender: t.results[0].Gender,
                                Phone: t.results[0].Phone,
                                PrescriberType: t.results[0].PrescriberType,
                                Specialities: i
                            });
                            var sp = null;
                            if (e.getView().getModel("DataModel").getProperty("/SpecialitiesSet") != null) {
                                sp = structuredClone(e.getView().getModel("DataModel").getProperty("/SpecialitiesSet"))
                            }
							e.getView().setModel(o, "DataModel");
                            if (sp != null) {
                                e.getView().getModel("DataModel").setProperty("/SpecialitiesSet", sp)
                            };
                            sap.ui.core.BusyIndicator.hide()
                        },
                        error: function(e) {}
                    })
                },
                handleChange: function(e) {
                    this.getView().byId("numColegiadoInput").setValue(this.getView().byId("numColegiadoInput").getValue().replace(/\D/g, ""))
                },
                f_submit: function() {
                    var e = new n({
                        text: "Su solicitud se está realizando. Por favor, espere."
                    });
                    e.open();
                    var t = this.getView(),
                        a = [
                            [t.byId("numColegiadoInput"), false],
                            [t.byId("nombreInput"), false],
                            [t.byId("apellido1Input"), false],
                            [t.byId("apellido2Input"), false],
                            [t.byId("documentoInput"), false],
                            [t.byId("emailInput"), false],
                            [t.byId("tlfInput"), false],
                            [t.byId("especialidadesInput"), true]
                        ],
                        i = false;
                    a.forEach(function(e) {
                        i = this._validateInput(e) || i
                    }, this);
                    if (!i) {
                        var o = {};
                        o.IdCollegiate = t.byId("numColegiadoInput").getValue();
                        o.Name = t.byId("nombreInput").getValue();
                        o.Surname1 = t.byId("apellido1Input").getValue();
                        o.Surname2 = t.byId("apellido2Input").getValue();
                        o.PersonalIdType = t.byId("documentoSelect").getSelectedKey();
                        o.PersonalId = t.byId("documentoInput").getValue();
                        o.Email = t.byId("emailInput").getValue();
                        o.Gender = t.byId("generoInput").getSelectedKey();
                        o.Phone = t.byId("tlfInput").getValue();
                        o.PrescriberType = t.byId("prescriberTypeInput").getSelectedKey();
                        o.MedicalToSpecialityNAV = [];
                        var s = t.byId("especialidadesInput").getSelectedKeys();
                        s.forEach(e => {
                            var t = {};
                            t.IdCollegiate = o.IdCollegiate;
                            t.Pernr = "12341";
                            t.Speciality = e;
                            o.MedicalToSpecialityNAV.push(t)
                        });
                        r.create("/MedicalRegistrationSet", o, {
                            async: true,
                            success: function() {
                                e.close();
                                l.confirm("El alta ya se ha realizado.\n\nEn breve, recibirá un correo de confirmación.\n\nYa puede realizar prescripción de recetas electrónicas.", {
                                    actions: [l.Action.OK],
                                    emphasizedAction: l.Action.OK,
                                    onClose: function(e) {
                                        window.close()
                                    }
                                })
                            },
                            error: function(t) {
                                e.close();
                                var a = t.response.body;
                                a = a.split("<message>");
                                a = a[1];
                                a = a.split("</message>");
                                sap.m.MessageBox.error(a[0], {
                                    title: "Error",
                                    initialFocus: null
                                })
                            }
                        })
                    } else {
                        e.close();
                        l.alert("Error de validación. Compruebe que todos los campos están rellenos e inténtelo de nuevo.")
                    }
                },
                _validateInput: function(e) {
                    var t = "None";
                    var a = false;
                    var i = e[0].getBinding("value");
                    if (e[1] === true) {
                        if (e[0].getSelectedKeys().length < 1) {
                            t = "Error";
                            a = true
                        }
                    } else {
                        try {
                            i.getType().validateValue(e[0].getValue())
                        } catch (e) {
                            t = "Error";
                            a = true
                        }
                    }
                    e[0].setValueState(t);
                    return a
                },
                handleSelectionChange: function(e) {
                    var t = e.getParameter("changedItem");
                    var a = e.getParameter("selected");
                    var i = "Selected";
                    if (!a) {
                        i = "Deselected"
                    }
                },
                onOpenPopoverDialog: function() {
                    if (!this.oApproveDialog) {
                        this.oApproveDialog = new t({
                            type: u.Message,
                            title: "Salir de la aplicación",
                            content: new o({
                                text: "Si no completa el alta en la plataforma REMPe no podrá crear recetas electrónicas, ¿está seguro de que desea salir?"
                            }),
                            beginButton: new a({
                                text: "Si",
                                press: function() {
                                    window.close()
                                }.bind(this)
                            }),
                            endButton: new a({
                                type: s.Emphasized,
                                text: "No",
                                press: function() {
                                    this.oApproveDialog.close()
                                }.bind(this)
                            })
                        })
                    }
                    this.oApproveDialog.open()
                }
            })
        });
    },
    "autoregistromedico/i18n/i18n.properties": '# This is the resource bundle for autoregistromedico\n\n#Texts for manifest.json\n\n#XTIT: Application name\nappTitle=Autoregistro M\\u00e9dico Grupo Recoletas\n\n#YDES: Application description\nappDescription=App de autoregistro m\\u00e9dico Grupo Recoletas\n#XTIT: Main view title\ntitle=Autoregistro M\\u00e9dico Grupo Recoletas',
    "autoregistromedico/manifest.json": '{"_version":"1.49.0","sap.app":{"id":"autoregistromedico","type":"application","i18n":"i18n/i18n.properties","applicationVersion":{"version":"0.0.1"},"title":"{{appTitle}}","description":"{{appDescription}}","resources":"resources.json","sourceTemplate":{"id":"@sap/generator-fiori:basic","version":"1.9.6","toolsId":"09bd4ace-9e37-4864-9b85-6895b64c307b"},"dataSources":{"mainService":{"uri":"/sap/opu/odata/sap/ZISH_REMPE_SRV/","type":"OData","settings":{"annotations":[],"localUri":"localService/metadata.xml","odataVersion":"2.0"}}}},"sap.ui":{"technology":"UI5","icons":{"icon":"","favIcon":"","phone":"","phone@2":"","tablet":"","tablet@2":""},"deviceTypes":{"desktop":true,"tablet":true,"phone":true}},"sap.ui5":{"flexEnabled":true,"dependencies":{"minUI5Version":"1.113.0","libs":{"sap.m":{},"sap.ui.core":{},"sap.f":{},"sap.suite.ui.generic.template":{},"sap.ui.comp":{},"sap.ui.generic.app":{},"sap.ui.table":{},"sap.ushell":{}}},"contentDensities":{"compact":true,"cozy":true},"models":{"i18n":{"type":"sap.ui.model.resource.ResourceModel","settings":{"bundleName":"autoregistromedico.i18n.i18n"}},"":{"dataSource":"mainService","preload":true,"settings":{}}},"resources":{"css":[{"uri":"css/style.css"}]},"routing":{"config":{"routerClass":"sap.m.routing.Router","viewType":"XML","async":true,"viewPath":"autoregistromedico.view","controlAggregation":"pages","controlId":"app","clearControlAggregation":false},"routes":[{"name":"RouteMain","pattern":":?query:","target":["TargetMain"]}],"targets":{"TargetMain":{"viewType":"XML","transition":"slide","clearControlAggregation":false,"viewId":"Main","viewName":"Main"}}},"rootView":{"viewName":"autoregistromedico.view.App","type":"XML","async":true,"id":"App"}}}',
    "autoregistromedico/model/models.js": function() {
        sap.ui.define(["sap/ui/model/json/JSONModel", "sap/ui/Device"], function(e, n) {
            "use strict";
            return {
                createDeviceModel: function() {
                    var i = new e(n);
                    i.setDefaultBindingMode("OneWay");
                    return i
                }
            }
        });
    },
    "autoregistromedico/view/App.view.xml": '<mvc:View controllerName="autoregistromedico.controller.App"\n    xmlns:html="http://www.w3.org/1999/xhtml"\n    xmlns:mvc="sap.ui.core.mvc"\n    xmlns="sap.m"><App id="app"></App></mvc:View>\n',
    "autoregistromedico/view/Main.view.xml": '<mvc:View controllerName="autoregistromedico.controller.Main"\n    xmlns:mvc="sap.ui.core.mvc" displayBlock="true"\n    xmlns="sap.m"\n    xmlns:f="sap.ui.layout.form"\n    xmlns:core="sap.ui.core"\n\txmlns:l="sap.ui.layout"><Page showFooter="false" id="page" title="{i18n>title}" class="sapUiSizeCompact"><content><f:SimpleForm id="SimpleFormChangeColumn_twoGroups234"\n\t\t\t\t\teditable="true"\n\t\t\t\t\tlayout="ColumnLayout"\n\t\t\t\t\tcolumnsM="1"\n\t\t\t\t\tcolumnsL="1"\n\t\t\t\t\tcolumnsXL="1"><f:content><Label id="numColegiadoLabel" text="Número de colegiado" /><Input\n\t\t\t\t\t\t\tid="numColegiadoInput"\n\t\t\t\t\t\t\tplaceholder="Número de colegiado"\n\t\t\t\t\t\t\tchange="handleChange"\n\t\t\t\t\t\t\tvalue="{\n\t\t\t\t\t\t\t\tpath : \'DataModel>/IdCollegiate\',\n\t\t\t\t\t\t\t\ttype : \'sap.ui.model.type.String\',\n\t\t\t\t\t\t\t\tconstraints : {\n\t\t\t\t\t\t\t\t\tminLength: 9\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}"/><Label id="nombreLabel" text="Nombre" /><Input\n\t\t\t\t\t\t\tid="nombreInput"\n\t\t\t\t\t\t\tplaceholder="Nombre"\n\t\t\t\t\t\t\tvalue="{\n\t\t\t\t\t\t\t\tpath : \'DataModel>/Name\',\n\t\t\t\t\t\t\t\ttype : \'sap.ui.model.type.String\',\n\t\t\t\t\t\t\t\tconstraints : {\n\t\t\t\t\t\t\t\t\tminLength: 1\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}"/><Label id="apellido1Label" text="Apellido 1" /><Input\n\t\t\t\t\t\t\tid="apellido1Input"\n\t\t\t\t\t\t\tplaceholder="Apellido 1"\n\t\t\t\t\t\t\tvalue="{\n\t\t\t\t\t\t\t\tpath : \'DataModel>/Surname1\',\n\t\t\t\t\t\t\t\ttype : \'sap.ui.model.type.String\',\n\t\t\t\t\t\t\t\tconstraints : {\n\t\t\t\t\t\t\t\t\tminLength: 1\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}"/><Label id="apellido2Label" text="Apellido 2" /><Input\n\t\t\t\t\t\t\tid="apellido2Input"\n\t\t\t\t\t\t\tplaceholder="Apellido 2"\n\t\t\t\t\t\t\tvalue="{\n\t\t\t\t\t\t\t\tpath : \'DataModel>/Surname2\',\n\t\t\t\t\t\t\t\ttype : \'sap.ui.model.type.String\',\n\t\t\t\t\t\t\t\tconstraints : {\n\t\t\t\t\t\t\t\t\tminLength: 1\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}"/><Label id="documentoLabel" text="Documento" /><Select id="documentoSelect"><items><core:Item id="dni" text="DNI" key="DNI" /><core:Item id="nie" text="NIE" key="NIE" /><core:Item id="pasaporte" text="Pasaporte" key="PASAPORTE" /><core:Item id="tarjetaResidencia" text="Tarjeta de Residencia Comunitaria" key="TARJETA_DE_RESIDENCIA_COMUNITARIA" /><core:Item id="permisoResidencia" text="Permiso de Residencia y Trabajo" key="PERMISO_DE_RESIDENCIA_Y_TRABAJO" /><core:Item id="documentosVarios" text="Documentos Varios" key="DOCUMENTOS_VARIOS" /><core:Item id="tarjetaSanitaria" text="Tarjeta Sanitaria" key="TARJETA_SANITARIA" /></items></Select><Input\n\t\t\t\t\t\t\tid="documentoInput"\n\t\t\t\t\t\t\tplaceholder="Documento"\n\t\t\t\t\t\t\tvalue="{\n\t\t\t\t\t\t\t\tpath : \'DataModel>/PersonalId\',\n\t\t\t\t\t\t\t\ttype : \'sap.ui.model.type.String\',\n\t\t\t\t\t\t\t\tconstraints : {\n\t\t\t\t\t\t\t\t\tminLength: 1\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}"/><Label id="emailLabel" text="E-mail" /><Input\n\t\t\t\t\t\t\tid="emailInput"\n\t\t\t\t\t\t\tplaceholder="Email"\n\t\t\t\t\t\t\ttype="Email"\n\t\t\t\t\t\t\tvalue="{\n\t\t\t\t\t\t\t\tpath : \'DataModel>/Email\',\n\t\t\t\t\t\t\t\ttype : \'sap.ui.model.type.String\',\n\t\t\t\t\t\t\t\tconstraints : {\n\t\t\t\t\t\t\t\t\tminLength: 1,\n\t\t\t\t\t\t\t\t\tsearch : \'\\\\S+@\\\\S+\\\\.\\\\S+\'\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}"/><Label id ="generoLabel" text="Género" /><Select id="generoInput" selectedKey="{DataModel>/Gender}"><items><core:Item id="genero4" text="No especificado" key="NO_ESPECIFICADO" /><core:Item id="genero1" text="Hombre" key="HOMBRE" /><core:Item id="genero2" text="Mujer" key="MUJER" /><core:Item id="genero3" text="Indeterminado" key="INDETERMINADO" /></items></Select><Label id="tlfLabel" text="Teléfono" /><Input\n\t\t\t\t\t\t\tid="tlfInput"\n\t\t\t\t\t\t\tplaceholder="Teléfono"\n\t\t\t\t\t\t\tvalue="{\n\t\t\t\t\t\t\t\tpath : \'DataModel>/Phone\',\n\t\t\t\t\t\t\t\ttype : \'sap.ui.model.type.String\',\n\t\t\t\t\t\t\t\tconstraints : {\n\t\t\t\t\t\t\t\t\tminLength: 1\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}"/><Label id="especialidadesLabel" text="Especialidades" /><MultiComboBox\n\t\t\t\t\t\tid="especialidadesInput"\n\t\t\t\t\t\tselectionChange="handleSelectionChange"\n\t\t\t\t\t\tselectionFinish="handleSelectionFinish"\n\t\t\t\t\t\tselectedKeys="{DataModel>/Specialities}"\n\t\t\t\t\t\titems="{\n\t\t\t\t\t\t\tpath: \'/SpecialitiesSet\',\n\t\t\t\t\t\t\tsorter: { path: \'Description\' }\n\t\t\t\t\t\t}"><core:Item id="item" key="{Idrempe}" text="{Description}"/></MultiComboBox><Label id ="prescriberTypeLabel" text="Tipo de Prescriptor" /><Select id="prescriberTypeInput"><items><core:Item id="12" text="Médico" key="MEDICO" /><core:Item id="22" text="Podólogo" key="PODOLOGO" /><core:Item id="32" text="Dentista" key="DENTISTA" /></items></Select></f:content></f:SimpleForm><Toolbar id="_IDGenToolbar1"><content><ToolbarSpacer id="_IDGenToolbarSpacer1" /><Button id="aceptarBtn" type="Accept"\n\t\t\t\t\t\t\ttext="Aceptar"\n\t\t\t\t\t\t\tpress=".f_submit" /><Button id="cancelarBtn"\n\t\t\t\t\t\ttext="Cancelar"\n\t\t\t\t\t\ttype="Reject"\n\t\t\t\t\t\tpress=".onOpenPopoverDialog"\n\t\t\t\t\t\tariaHasPopup="Dialog" /></content></Toolbar></content></Page></mvc:View>\n'
});
//# sourceMappingURL=Component-preload.js.map