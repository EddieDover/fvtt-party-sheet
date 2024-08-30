// @ts-ignore
export class TemplateStatusForm extends FormApplication {
  /**
   * @param {TemplateValidityReturnData} template_validation - The template validation data
   */
  constructor(template_validation) {
    super();
    this.template_validation = template_validation;
  }

  getData(options) {
    console.log(this.template_validation);
    // @ts-ignore
    return mergeObject(super.getData(options), {
      outOfDate: this.template_validation.outOfDate,
      tooNew: this.template_validation.tooNew,
      noVersionInformation: this.template_validation.noVersionInformation,
      // @ts-ignore
      systemVersion: game.system.version,
    });
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
