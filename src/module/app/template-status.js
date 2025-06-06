// @ts-ignore
export class TemplateStatusForm extends FormApplication {
  constructor() {
    super();
    // @ts-ignore
    this.template_validation = game.settings.get("fvtt-party-sheet", "validationInfo") || {};
  }

  getData(options) {
    // @ts-ignore
    return foundry.utils.mergeObject(super.getData(options), {
      outOfDateTemplates: this.template_validation.outOfDateTemplates,
      outOfDateSystems: this.template_validation.outOfDateSystems,
      noVersionInformation: this.template_validation.noVersionInformation,
      noSystemInformation: this.template_validation.noSystemInformation,
      valid: this.template_validation.valid,
      // @ts-ignore
      systemVersion: game.system.version,
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    // @ts-ignore
    // eslint-disable-next-line no-undef
    $('button[name="fvtt-party-sheet-template-ok-btn').click(this.CloseSheet.bind(this));
  }

  CloseSheet() {
    // @ts-ignore
    this.close();
  }

  static get defaultOptions() {
    // @ts-ignore
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "fvtt-party-sheet-template-status-dialog",
      classes: ["form"],
      title: "Party Sheet Template Status",
      // resizable: true,
      template: "modules/fvtt-party-sheet/templates/template-status.hbs",
      // @ts-ignore
      width: "auto", // $(window).width() > 960 ? 960 : $(window).width() - 100,
      height: "auto", //$(window).height() > 800 ? 800 : $(window).height() - 100,
    });
  }
}
