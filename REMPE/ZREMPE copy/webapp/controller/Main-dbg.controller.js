sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/library",
	"sap/m/Text",
    "sap/m/MessageBox",
	"sap/m/BusyDialog"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Dialog, Button, mobileLibrary, Text, MessageBox, BusyDialog) {
        "use strict";

        var oDataService = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZISH_REMPE_SRV/");

        // shortcut for sap.m.ButtonType
        var ButtonType = mobileLibrary.ButtonType;

        // shortcut for sap.m.DialogType
        var DialogType = mobileLibrary.DialogType;

        return Controller.extend("autoregistromedico.controller.Main", {
            onInit: function () {
                sap.ui.core.BusyIndicator.show(0);
                this.f_loadSpecialities();
                this.f_loadFormModel();
            },

            f_loadSpecialities: function () {
                var oThis = this;
                oDataService.read("/SpecialitiesSet",
                {
                    success: function(data){
                        oThis.getView().setModel(new sap.ui.model.json.JSONModel({
                            "SpecialitiesSet": data.results
                        }), "DataModel");
                    },
                    error: function(error){}
                });

            },

            f_loadFormModel: function () {
                var oThis = this;
                oDataService.read("/MedicalRegistrationSet?$expand=MedicalToSpecialityNAV",
                {
                    success: function(data){
                        var selectedSpecialitiesArray = data.results[0].MedicalToSpecialityNAV.results;
                        var selectedSpecialities = [];

                        selectedSpecialitiesArray.forEach(element => {
                            selectedSpecialities.push(element.Speciality);
                        });

                        var oModel = new sap.ui.model.json.JSONModel({
                            "IdCollegiate": data.results[0].IdCollegiate,
                            "Name": data.results[0].Name,
                            "Surname1": data.results[0].Surname1,
                            "Surname2": data.results[0].Surname2,
                            "PersonalId": data.results[0].PersonalId,
                            "Email": data.results[0].Email,
                            "Gender": data.results[0].Gender,
                            "Phone": data.results[0].Phone,
                            "PrescriberType": data.results[0].PrescriberType,
                            "Specialities": selectedSpecialities
                        });
                        oThis.getView().setModel(oModel, "DataModel");
                        sap.ui.core.BusyIndicator.hide();
                    },
                    error: function(error){}
                });
            },

            handleChange: function(event) {
                // We remove the characters that are not numbers from the imput
                this.getView().byId("numColegiadoInput").setValue(this.getView().byId("numColegiadoInput").getValue().replace(/\D/g, ""));
            },

            f_submit: function () {
                //sap.ui.core.BusyIndicator.show(0);
                var busy = new BusyDialog({
                    text: 'Su solicitud se está realizando. Por favor, espere.'
                });

                busy.open();
                // collect input controls
                var oView = this.getView(),
                    aInputs = [
                    [oView.byId("numColegiadoInput"), false],
                    [oView.byId("nombreInput"), false],
                    [oView.byId("apellido1Input"), false],
                    [oView.byId("apellido2Input"), false],
                    [oView.byId("documentoInput"), false],
                    [oView.byId("emailInput"), false],
                    [oView.byId("tlfInput"), false],
                    [oView.byId("especialidadesInput"), true]
                ],
                bValidationError = false;

	        // Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInput(oInput) || bValidationError;
			}, this);

			    if (!bValidationError) {

                    var oEntry = {};

                    oEntry.IdCollegiate = oView.byId("numColegiadoInput").getValue();
                    oEntry.Name = oView.byId("nombreInput").getValue();
                    oEntry.Surname1 = oView.byId("apellido1Input").getValue();
                    oEntry.Surname2 = oView.byId("apellido2Input").getValue();
                    oEntry.PersonalIdType = oView.byId("documentoSelect").getSelectedKey();
                    oEntry.PersonalId = oView.byId("documentoInput").getValue();
                    oEntry.Email = oView.byId("emailInput").getValue();
                    oEntry.Gender = oView.byId("generoInput").getSelectedKey();
                    oEntry.Phone = oView.byId("tlfInput").getValue();
                    oEntry.PrescriberType = oView.byId("prescriberTypeInput").getSelectedKey();
                    oEntry.MedicalToSpecialityNAV = [];

                    var specialities = oView.byId("especialidadesInput").getSelectedKeys();

                    specialities.forEach(specialityId => {
                        var specialityData = {};

                        specialityData.IdCollegiate = oEntry.IdCollegiate;
                        specialityData.Pernr = "12341";
                        specialityData.Speciality = specialityId;

                        oEntry.MedicalToSpecialityNAV.push(specialityData);
                    });

                        oDataService.create("/MedicalRegistrationSet" , oEntry, {
                            async: true,
                            success: function(){
                                //sap.ui.core.BusyIndicator.hide();
                                busy.close();
                                MessageBox.confirm("El alta ya se ha realizado.\n\nEn breve, recibirá un correo de confirmación.\n\nYa puede realizar prescripción de recetas electrónicas.", {
                                    actions: [MessageBox.Action.OK],
                                    emphasizedAction: MessageBox.Action.OK,
                                    onClose: function (sAction) {
                                        window.close();
                                    }
                                });
                            },
                            error: function(error) {
                                //sap.ui.core.BusyIndicator.hide();
                                busy.close();
                                var errorBody = error.response.body;
                                errorBody = errorBody.split('<message>');
                                errorBody = errorBody[1];
                                errorBody = errorBody.split('</message>');
        
                            sap.m.MessageBox.error(errorBody[0], {
                                title: "Error",
                                initialFocus: null
                                });
                            }
                        });
                } else {
                    busy.close();
                    MessageBox.alert("Error de validación. Compruebe que todos los campos están rellenos e inténtelo de nuevo.");
                }
            
            },

            _validateInput: function (oInput) {
                var sValueState = "None";
                var bValidationError = false;
                var oBinding = oInput[0].getBinding("value");
    
                if(oInput[1] === true) {

                    if (oInput[0].getSelectedKeys().length < 1) {
                        sValueState = "Error";
                        bValidationError = true;
                    }

                } else {

                    try {
                        oBinding.getType().validateValue(oInput[0].getValue());
                    } catch (oException) {
                        sValueState = "Error";
                        bValidationError = true;
                    }

                }

    
                oInput[0].setValueState(sValueState);
    
                return bValidationError;
            },

            handleSelectionChange: function(oEvent) {
                var changedItem = oEvent.getParameter("changedItem");
                var isSelected = oEvent.getParameter("selected");
    
                var state = "Selected";
                if (!isSelected) {
                    state = "Deselected";
                }
            },

            onOpenPopoverDialog: function () {
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new Dialog({
                        type: DialogType.Message,
                        title: "Salir de la aplicación",
                        content: new Text({ text: "Si no completa el alta en la plataforma REMPe no podrá crear recetas electrónicas, ¿está seguro de que desea salir?" }),
                        beginButton: new Button({
                            text: "Si",
                            press: function () {
                                window.close();
                            }.bind(this)
                        }),
                        endButton: new Button({
                            type: ButtonType.Emphasized,
                            text: "No",
                            press: function () {
                                this.oApproveDialog.close();
                            }.bind(this)
                        })
                    });
                }
    
                this.oApproveDialog.open();
            },
        });
    });
