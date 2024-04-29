import * as yup from 'yup';
import i18next from 'i18next';
import { elements, makeStateWatched } from './View.js';
import { getNormalizedData, loadDataFromUrl, parseData } from './Utils.js';

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

  const handleValidationError = (err) => {
    watchedState.errors.allValidationErrors.push(err.message);
    watchedState.addingForm.validation.currentError = '';
    watchedState.addingForm.validation.currentError = err.message;
    watchedState.addingForm.validation.state = 'unvalid';
    watchedState.addingForm.state = 'processed';
  };

  const handleLoadingError = (err) => {
    watchedState.errors.allLoadingErrors.push(err.message);
    watchedState.loadingProcess.error = '';
    watchedState.loadingProcess.error = 'loading error';
    watchedState.loadingProcess.state = 'failed';
  };

  const handleParsingError = (err) => {
    watchedState.errors.allParsingErrors.push(err.message);
    watchedState.parsingProcess.error = '';
    watchedState.parsingProcess.error = 'parsing error';
    watchedState.parsingProcess.state = 'failed';
  };

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
      .then((url) => {
        watchedState.addingForm.state = 'processed';
        watchedState.addingForm.validation.state = 'valid';
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
        if (err.isAxiosError) {
          return handleLoadingError(err);
        }
        switch (err.name) {
          case 'ValidationError':
            return handleValidationError(err);
          case 'ParseError':
            return handleParsingError(err);
          default:
            throw new Error(`Unknown error - ${err.message}!`);
        }
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
