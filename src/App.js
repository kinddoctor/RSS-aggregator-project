import * as yup from 'yup';
import i18next from 'i18next';
import { elements, makeStateWatched } from './View.js';
import {
  getNormalizedData, getRenewedData,
  loadDataFromUrl, parseData,
} from './Utils.js';

const app = (i18nextInst) => {
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
    UIstate: {
      watchedPostsIds: [],
    },
  };
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
        watchedState.addedRSSData.posts = { ...posts, ...newPosts };
        watchedState.addedRSSData.feeds = { ...feeds, ...newFeed };
      })
      .catch((err) => {
        handleErrors(err);
      });
  };

  const handleInputChange = ({ target }) => {
    const url = target.value;
    watchedState.form.value = url;
    watchedState.form.state = 'filling';
    watchedState.form.validation.state = null;
  };

  const putDataIntoModal = (event) => {
    const button = event.relatedTarget;
    const postId = button.getAttribute('data-id');
    const { title, description } = watchedState.addedRSSData.posts[postId];
    elements.modalTitle.textContent = title;
    elements.modalTextArea.textContent = description;
  };

  const updatePostsList = (links) => {
    if (links.length === 0) {
      return setTimeout(() => updatePostsList(watchedState.addedRSSLinks), '5000');
    }
    const newData = { feeds: {}, posts: {} };
    const oldData = watchedState.addedRSSData;
    const promises = links.map((link) => Promise.resolve(loadDataFromUrl(link)));
    return Promise.all(promises)
      .then((values) => {
        values.forEach(({ data }) => {
          const xml = parseData(data);
          const { feed: newFeed, posts: newPosts } = getNormalizedData(xml);
          newData.feeds = { ...newData.feeds, ...newFeed };
          newData.posts = { ...newData.posts, ...newPosts };
        });
        const { renewedFeeds, renewedPosts } = getRenewedData(oldData, newData);
        watchedState.addedRSSData.posts = { ...renewedPosts };
        watchedState.addedRSSData.feeds = { ...renewedFeeds };
      })
      .catch((err) => {
        handleErrors(err);
      })
      .finally(() => setTimeout(() => updatePostsList(watchedState.addedRSSLinks), '5000'));
  };

  elements.input.addEventListener('input', handleInputChange);
  elements.form.addEventListener('submit', handleSubmit);
  elements.modal.addEventListener('show.bs.modal', putDataIntoModal);
  updatePostsList(watchedState.addedRSSLinks);
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
