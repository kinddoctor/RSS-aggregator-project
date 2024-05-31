import * as yup from 'yup';
import i18next from 'i18next';
import * as _ from 'lodash';
import makeStateWatched from './View.js';
import {
  loadData, parseData,
  getUniqueId,
} from './Utils.js';

const app = (initialState, i18nextInst) => {
  const UIelements = {
    body: document.querySelector('body'),
    postsAndFeedsArea: document.querySelector('.container-xxl'),
    form: document.querySelector('form'),
    input: document.querySelector('#url-input'),
    button: document.querySelector('button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    posts: {
      title: document.querySelector('div.posts h2'),
      list: document.querySelector('div.posts ul'),
    },
    feeds: {
      title: document.querySelector('div.feeds h2'),
      list: document.querySelector('div.feeds ul'),
    },
    modal: document.querySelector('#modal'),
    modalTitle: document.querySelector('.modal-title'),
    modalTextArea: document.querySelector('.modal-body'),
    modalFullArticleButton: document.querySelector('.full-article'),
  };
  const watchedState = makeStateWatched(initialState, UIelements, i18nextInst);

  const handleError = ({ message }) => {
    watchedState.state = 'error';
    const expectedErrorMessages = [
      'Network Error', 'Parsing Error', 'doesn`t has rss', 'invalid url', 'already exists',
    ];
    if (expectedErrorMessages.includes(message)) {
      watchedState.errorMessage = '';
      watchedState.errorMessage = message.toLowerCase();
    } else {
      watchedState.errorMessage = `Unexpected error - ${message}`;
    }
  };

  const validate = (url) => {
    yup.setLocale({
      mixed: { notOneOf: 'already exists' },
      string: { url: 'invalid url' },
    });
    const schema = yup.string().url().notOneOf(watchedState.addedRSSLinks);
    return schema.validate(url);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    watchedState.state = 'validating';
    const urlString = watchedState.inputValue;
    validate(urlString)
      .then((url) => {
        watchedState.state = 'loading';
        return loadData(url);
      })
      .then(({ data }) => {
        const url = watchedState.inputValue;
        watchedState.state = 'parsing';
        const { feed: newFeed, posts: newPosts } = parseData(data.contents);
        watchedState.addedRSSLinks.push(url);
        watchedState.state = 'success';
        const feedId = getUniqueId();
        newFeed.id = feedId;
        const { feeds, posts } = watchedState.addedRSSData;
        const newPostsFulfilled = newPosts.map((post) => ({ ...post, feedId, id: getUniqueId() }));
        watchedState.addedRSSData.posts = [...posts, ...newPostsFulfilled];
        watchedState.addedRSSData.feeds = [...feeds, newFeed];
      })
      .catch((err) => {
        handleError(err);
      });
  };

  const handleInputChange = ({ target }) => {
    const url = target.value;
    watchedState.inputValue = url;
    watchedState.state = 'filling';
  };

  const handlePostsClick = (e) => {
    const linkOrBtnElement = e.target.hasAttribute('data-id');
    if (linkOrBtnElement) {
      const id = e.target.getAttribute('data-id');
      watchedState.UIstate.watchedPostsIds.push(id);
    }
  };

  const handleModal = (event) => {
    const button = event.relatedTarget;
    const clickedPostId = button.getAttribute('data-id');
    const clickedPost = watchedState.addedRSSData.posts.filter(({ id }) => id === clickedPostId)[0];
    const { title, description, url } = clickedPost;
    watchedState.UIstate.modalData = {};
    watchedState.UIstate.modalData = { title, description, url };
  };

  const updatePostsList = (links) => {
    if (links.length === 0) {
      return setTimeout(() => updatePostsList(watchedState.addedRSSLinks), '5000');
    }
    let allNewPosts = [];
    const promises = links.map((link) => Promise.resolve(loadData(link)));
    return Promise.all(promises)
      .then((values) => {
        values.forEach(({ data }) => {
          const freshData = parseData(data.contents);
          const { feed: freshFeed, posts: freshPosts } = freshData;
          const { feeds, posts } = watchedState.addedRSSData;
          const feedId = feeds.filter((feed) => feed.title === freshFeed.title)[0].id;
          const postsToAdd = _.differenceWith(freshPosts, posts, (fresh, old) => fresh.title === old.title);
          allNewPosts = [...allNewPosts, ...postsToAdd.map((post) => ({ ...post, feedId, id: getUniqueId() }))];
        });
        watchedState.addedRSSData.posts = [...watchedState.addedRSSData.posts, ...allNewPosts];
      })
      .catch((err) => {
        handleError(err);
      })
      .finally(() => setTimeout(() => updatePostsList(watchedState.addedRSSLinks), '5000'));
  };

  UIelements.input.addEventListener('input', handleInputChange);
  UIelements.form.addEventListener('submit', handleSubmit);
  UIelements.modal.addEventListener('show.bs.modal', handleModal);
  UIelements.postsAndFeedsArea.addEventListener('click', handlePostsClick);
  updatePostsList(watchedState.addedRSSLinks);
};

const runApp = () => {
  const initialState = {
    state: 'initialState',
    errorMessage: '',
    inputValue: '',
    addedRSSLinks: [],
    addedRSSData: { feeds: [], posts: [] },
    UIstate: {
      watchedPostsIds: [],
      modalData: {}, // title, description, postUrl
    },
  };
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru: {
        translation: {
          error: {
            'invalid url': 'Ссылка должна быть валидным URL',
            'already exists': 'RSS уже существует',
            'network error': 'Ошибка сети',
            'doesn`t has rss': 'Ресурс не содержит валидный RSS',
            'parsing error': 'Ошибка обработки данных',
          },
          unexpectedError: '{{error}}',
          loadingProcess: 'Идет загрузка',
          success: 'RSS успешно загружен',
          postsTitle: 'Посты',
          feedsTitle: 'Фиды',
        },
      },
    },
  }).then(() => app(initialState, i18nextInstance));
};

export default runApp;
