import * as yup from 'yup';
import i18next from 'i18next';
import { elements, makeStateWatched } from './View.js';
import { getNormalizedData, loadDataFromUrl, parseData } from './Utils.js';

const initialState = {
  form: {
    state: 'filling',
    value: '',
    validation: {
      state: null,
      error: '',
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
};

const app = (i18nextInst) => {
  const watchedState = makeStateWatched(initialState, i18nextInst);

  const handleValidationError = (err) => {
    watchedState.form.validation.error = '';
    watchedState.form.validation.error = err.message;
    watchedState.form.validation.state = 'unvalid';
    watchedState.form.state = 'processed';
  };
  const handleError = (err, process) => {
    const stateField = `${process}Process`;
    watchedState[stateField].error = '';
    watchedState[stateField].error = `${process} error`;
    watchedState[stateField].state = 'failed';
    console.log(`Error - ${err.message}!`);
  };
  const handleErrors = (err) => {
    if (err.isAxiosError) {
      return handleError(err, 'loading');
    }
    switch (err.name) {
      case 'ValidationError':
        return handleValidationError(err);
      case 'ParseError':
        return handleError(err, 'parsing');
      default:
        throw new Error(`Unknown error - ${err.message}!`);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    watchedState.form.state = 'processing';
    const urlString = watchedState.form.value;
    const promise = Promise.resolve(urlString);
    promise
      .then((url) => {
        yup.setLocale({
          mixed: { notOneOf: 'already exists' },
          string: { url: 'invalid url' },
        });
        const schema = yup.string().url().notOneOf(watchedState.addedRSSLinks);
        return schema.validate(url);
      })
      .then((url) => {
        watchedState.form.state = 'processed';
        watchedState.form.validation.state = 'valid';
        watchedState.addedRSSLinks.push(url);
        watchedState.loadingProcess.state = 'loading';
        return loadDataFromUrl(url);
      })
      .then(({ data }) => {
        watchedState.loadingProcess.state = 'loaded';
        watchedState.parsingProcess.state = 'parsing';
        const xml = parseData(data);

        watchedState.parsingProcess.state = 'parsed';
        const { feed: newFeed, posts: newPosts } = getNormalizedData(xml);
        const { feeds, posts } = watchedState.addedRSSData;
        watchedState.addedRSSData.feeds = { ...feeds, ...newFeed };
        watchedState.addedRSSData.posts = { ...posts, ...newPosts };
      })
      .catch((err) => {
        handleErrors(err);
      });
  };

  const handleChange = ({ target }) => {
    const url = target.value;
    watchedState.form.value = url;
    watchedState.form.state = 'filling';
    watchedState.form.validation.state = null;
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
