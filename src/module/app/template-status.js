// @ts-ignore
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TemplateStatusForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    form: {
      handler: TemplateStatusForm.formHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    window: {
      title: "Party Sheet Template Status",
      width: "auto",
      height: "auto",
    },
    classes: ["fvtt-party-sheet-template-status-dialog"],
    actions: {
      onCloseSheet: TemplateStatusForm.onCloseSheet,
    },
  };

  static PARTS = {
    form: {
      template: "modules/fvtt-party-sheet/templates/template-status.hbs",
    },
  };

  static formHandler(event, form, formData) {
    event.preventDefault();
    event.stopPropagation();
    // Handle form submission logic here if needed
  }

  constructor() {
    super();
    // @ts-ignore
    this.template_validation = game.settings.get("fvtt-party-sheet", "validationInfo") || {};
  }

  _prepareContext(options) {
    return {
      outOfDateTemplates: this.template_validation.outOfDateTemplates,
      outOfDateSystems: this.template_validation.outOfDateSystems,
      tooNewSystems: this.template_validation.tooNewSystems,
      noVersionInformation: this.template_validation.noVersionInformation,
      noSystemInformation: this.template_validation.noSystemInformation,
      valid: this.template_validation.valid,
      // @ts-ignore
      systemVersion: game.system.version,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    // Actions are automatically bound by ApplicationV2
  }

  onCloseSheet(event) {
    event.preventDefault();
    // @ts-ignore
    this.close();
  }

  static onCloseSheet(event, target) {
    event.preventDefault();
    // @ts-ignore
    this.close();
  }
}
