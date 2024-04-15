import onChange from 'on-change';

const elements = {
  form: document.querySelector('form'),
  input: document.querySelector('#url-input'),
  button: document.querySelector('button[type="submit"]'),
  feedback: document.querySelector('.feedback'),
};

let i18nextInstance;

const handleProcessState = (processState) => {
  switch (processState) {
    case 'filling':
      elements.feedback.textContent = '';
      elements.input.classList.remove('is-invalid');
      break;
    case 'processing':
      elements.button.classList.add('disabled');
      elements.input.setAttribute('disabled', '');
      break;
    case 'processed':
      elements.button.classList.remove('disabled');
      elements.input.removeAttribute('disabled');
      elements.input.focus();
      break;
    default:
      throw new Error(`Unknown processState - ${processState}!`);
  }
};

const handleValidationState = (state) => {
  switch (state) {
    case 'valid':
      elements.form.reset();
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      elements.feedback.textContent = i18nextInstance.t('validation.success');
      break;
    case 'unvalid':
      elements.input.classList.add('is-invalid');
      elements.feedback.classList.remove('text-success');
      elements.feedback.classList.add('text-danger');
      break;
    default:
      break;
  }
};

const handleValidationError = (error) => {
  console.log(`0!0${JSON.stringify(error)}`);
  elements.feedback.textContent = i18nextInstance.t(`validation.errors.${error}`);
};

const render = (path, value) => {
  switch (path) {
    case 'addingRSSFeedProcess.state':
      handleProcessState(value);
      break;
    case 'addingRSSFeedProcess.validation.state':
      handleValidationState(value);
      break;
    case 'addingRSSFeedProcess.validation.currentError':
      handleValidationError(value);
      break;
    default:
      break;
  }
};

const makeStateWatched = (state, i18nextInst) => {
  i18nextInstance = i18nextInst;
  console.log(`!!!${JSON.stringify(i18nextInstance)}`);
  return onChange(state, render);
};

export { elements, makeStateWatched };
