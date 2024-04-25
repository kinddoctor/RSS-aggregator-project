import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import { elements, makeStateWatched } from './View.js';
import getNormalizedData from './Utils.js';

const app = (i18nextInst) => {
  const initialState = {
    addingForm: {
      state: 'filling',
      value: '',
      validation: {
        state: null,
        currentError: '',
      },
    },
    loadingProcess: {
      state: '',
      error: '',
    },
    parsingProcess: {
      state: '',
      error: '',
    },
    addedRSSLinks: [],
    addedRSSData: { feeds: {}, posts: {} },
    errors: {
      allValidationErrors: [],
      allLoadingErrors: [],
      allParsingErrors: [],
    },
  };
  const watchedState = makeStateWatched(initialState, i18nextInst);

  const handleSubmit = (event) => {
    event.preventDefault();
    watchedState.addingForm.state = 'processing';
    const urlString = watchedState.addingForm.value;
    const promise = Promise.resolve(urlString);
    promise
      .then((url) => {
        yup.setLocale({
          mixed: {
            notOneOf: 'already exists',
          },
          string: {
            url: 'invalid url',
          },
        });
        const schema = yup.string().url().notOneOf(watchedState.addedRSSLinks);
        return schema.validate(url);
      })
      .then((validUrl) => {
        watchedState.addingForm.state = 'processed';
        watchedState.addingForm.validation.state = 'valid';
        watchedState.addedRSSLinks.push(validUrl);
        return validUrl;
      })
      .catch((err) => {
        watchedState.errors.allValidationErrors.push(err.message);
        watchedState.addingForm.validation.currentError = '';
        watchedState.addingForm.validation.currentError = err.message;
        watchedState.addingForm.validation.state = 'unvalid';
        watchedState.addingForm.state = 'processed';
      })
      .then((url) => {
        const proxiedUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${url}`;
        return axios.get(proxiedUrl);
      })
      .then(({ data }) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
        return xmlDoc;
      })
      .then((xml) => {
        const { feed: newFeed, posts: newPosts } = getNormalizedData(xml);
        console.log(`000${JSON.stringify(newFeed)}`);
        console.log(`!!!${JSON.stringify(newPosts)}`);
      });
  };

  const handleChange = ({ target }) => {
    const url = target.value;
    watchedState.addingForm.value = url;
    watchedState.addingForm.state = 'filling';
    watchedState.addingForm.validation.state = null;
  };

  elements.input.addEventListener('input', handleChange);
  elements.form.addEventListener('submit', handleSubmit);
};

const runApp = () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru: {
        translation: {
          validation: {
            success: 'RSS успешно загружен',
            errors: {
              'invalid url': 'Ссылка должна быть валидным URL',
              'already exists': 'RSS уже существует',
            },
          },
        },
      },
    },
  }).then(() => app(i18nextInstance));
};

export default runApp;
