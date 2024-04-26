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
        watchedState.loadingProcess.state = 'loading';
        const proxyHTTPAddress = 'https://allorigins.hexlet.app/get?disableCache=true&url=';
        const proxiedUrl = `${proxyHTTPAddress}${url}`;
        return axios.get(proxiedUrl);
      })
      .catch((err) => {
        watchedState.errors.allLoadingErrors.push(err.message);
        watchedState.loadingProcess.error = '';
        watchedState.loadingProcess.error = 'loading error';
        watchedState.loadingProcess.state = 'failed';
      })
      .then(({ data }) => {
        watchedState.loadingProcess.state = 'loaded';
        watchedState.parsingProcess.state = 'parsing';
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
        return xmlDoc;
      })
      .catch((err) => {
        watchedState.errors.allParsingErrors.push(err.message);
        watchedState.parsingProcess.error = '';
        watchedState.parsingProcess.error = 'parsing error';
        watchedState.parsingProcess.state = 'failed';
      })
      .then((xml) => {
        watchedState.parsingProcess.state = 'parsed';
        const { feed: newFeed, posts: newPosts } = getNormalizedData(xml);
        const { feeds, posts } = watchedState.addedRSSData;
        watchedState.addedRSSData.feeds = { ...feeds, newFeed };
        watchedState.addedRSSData.posts = { ...posts, newPosts };
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
            success: 'RSS добавлен',
            errors: {
              'invalid url': 'Ссылка должна быть валидным URL',
              'already exists': 'RSS уже существует',
            },
          },
          loading: {
            processing: 'Идет загрузка',
            success: 'RSS успешно загружен',
            errors: {
              'loading error': 'Ошибка сети',
            },
          },
          parsing: {
            errors: {
              'parsing error': 'Ошибка обработки данных',
            },
          },
          postsTitle: 'Посты',
          feedsTitle: 'Фиды',
        },
      },
    },
  }).then(() => app(i18nextInstance));
};

export default runApp;
