import * as yup from 'yup';
import i18next from 'i18next';
import { elements, makeStateWatched } from './View.js';

const app = (i18nextInst) => {
  const initialState = {
    addedRSSFeeds: [],
    errors: {
      allValidationErrors: [],
    },
    addingRSSFeedProcess: {
      state: 'filling',
      value: '',
      validation: {
        state: null,
        currentError: '',
      },
    },
  };
  const watchedState = makeStateWatched(initialState, i18nextInst);

  const handleSubmit = (event) => {
    event.preventDefault();
    watchedState.addingRSSFeedProcess.state = 'processing';
    const urlString = watchedState.addingRSSFeedProcess.value;
    const promise = Promise.resolve(urlString);
    promise
      .then((url) => {
        yup.setLocale({
          string: {
            url: 'invalid url',
            notOneOf: 'already exists',
          },
        });
        const schema = yup.string().url().notOneOf(watchedState.addedRSSFeeds);
        return schema.validate(url);
      })
      .then((validUrl) => {
        watchedState.addingRSSFeedProcess.state = 'processed';
        watchedState.addingRSSFeedProcess.validation.state = 'valid';
        watchedState.addedRSSFeeds.push(validUrl);
      })
      .catch((err) => {
        watchedState.errors.allValidationErrors.push(err.message);
        watchedState.addingRSSFeedProcess.validation.currentError = err.message;
        watchedState.addingRSSFeedProcess.validation.state = 'unvalid';
        watchedState.addingRSSFeedProcess.state = 'processed';
      });
  };

  const handleChange = ({ target }) => {
    const url = target.value;
    watchedState.addingRSSFeedProcess.value = url;
    watchedState.addingRSSFeedProcess.state = 'filling';
    watchedState.addingRSSFeedProcess.validation.state = null;
  };

  elements.input.addEventListener('input', handleChange);
  elements.form.addEventListener('submit', handleSubmit);
};

const runApp = () => {
  const i18nextInstance = i18next.createInstance();
  const promise = Promise.resolve(i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru: {
        translation: {
          validation: {
            success: 'RSS успешно загружен',
            errors: {
              'invalid url': 'Ссылка должна быть валидным URL',
              'already exist': 'RSS уже существует',
            },
          },
        },
      },
    },
  }));
  promise.then((instance) => app(instance));
};

export default runApp;
