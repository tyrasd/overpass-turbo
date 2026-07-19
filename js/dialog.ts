// modal dialogs
import $ from "jquery";

/** a button of the modal dialogs created by {@link showDialog} */
export interface DialogButton {
  name: string;
  callback?: () => void;
}

export function showDialog(
  title: string,
  content: string,
  buttons: DialogButton[]
): void {
  const dialogContent = `\
      <div class="modal is-active">\
        <div class="modal-background"></div>\
        <div class="modal-card">\
          <header class="modal-card-head">\
            <p class="modal-card-title">${title}</p>\
            <button class="delete" aria-label="close"></button>\
          </header>\
          <section class="modal-card-body">\
            ${content}\
          </section>\
          <footer class="modal-card-foot">\
            <div class="level">\
              <div class="level-right">\
                <div class="level-item">\
                </div>\
              </div>\
            </div>\
          </footer>\
        </div>\
      </div>\
    `;

  // Create modal in body
  const element = $(dialogContent);
  // Handle close event
  $(".delete", element).click(() => $(element).remove());

  // Add all the buttons
  for (const index in buttons) {
    const button = buttons[index];
    $(`<button class="button">${button.name}</button>`)
      .click(() => {
        button.callback?.();
        // destroy modal dialog after callback, see #528
        $(element).remove();
      })
      .appendTo($("footer .level-item", element));
  }

  // Add the element to the body
  element.appendTo("body");
}
