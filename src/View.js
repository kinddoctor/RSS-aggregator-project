import onChange from 'on-change';

const elements = {
    form: document.querySelector('form'),
    input: document.querySelector('#url-input'),
    button: document.querySelector('button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
};

const handleProcessState = (elements, processState) => {
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

const handleValidation = (elements, validationStatus) => {
    switch (validationStatus) {
        case 'true':
            elements.form.reset();
            elements.feedback.classList.remove('text-danger');
            elements.feedback.classList.add('text-success');
            elements.feedback.textContent = 'RSS успешно загружен';
            break;
        case 'false':
            elements.input.classList.add('is-invalid');
            elements.feedback.classList.remove('text-success');
            elements.feedback.classList.add('text-danger');
            elements.feedback.textContent = 'Ссылка должна быть валидным URL';
            break;
        default:
            throw new Error(`Unknown validationStatus - ${validationStatus}!`);
    }
};

const render = (path, value) => {
    switch (path) {
        case 'addingRSSFeedProcess.state':
            handleProcessState(elements, value);
            break;
        case 'addingRSSFeedProcess.valid':
            handleValidation(elements, value);
            break;
        case 'addingRSSFeedProcess.errors':
            console.log(`An error has occured - ${value}`);
            break;
        case 'addedRSSFeeds':
            console.log(`RSS feed added - ${value}`);
            break;
        default:
            throw new Error(`Unknown path - ${path}!`);  
    }
};

const makeStateWatched = (state) => onChange(state, render);

export { elements, makeStateWatched };
