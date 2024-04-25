import onChange from 'on-change';

const elements = {
  form: document.querySelector('form'),
  input: document.querySelector('#url-input'),
  button: document.querySelector('button[type="submit"]'),
  feedback: document.querySelector('.feedback'),
};

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

const handleValidationState = (state, i18nextInstance) => {
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

const handleValidationError = (error, i18nextInstance) => {
  elements.feedback.textContent = i18nextInstance.t(`validation.errors.${error}`);
};

const getRender = (i18nextInstance) => (path, value) => {
  const render = (pth, val) => {
    switch (pth) {
      case 'addingForm.state':
        handleProcessState(val);
        break;
      case 'addingForm.validation.state':
        handleValidationState(val, i18nextInstance);
        break;
      case 'addingForm.validation.currentError':
        handleValidationError(val, i18nextInstance);
        break;
      default:
        break;
    }
  };
  return render(path, value);
};

const makeStateWatched = (state, i18nextInst) => onChange(state, getRender(i18nextInst));

export { elements, makeStateWatched };
