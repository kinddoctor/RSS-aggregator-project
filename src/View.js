import onChange from 'on-change';

const elements = {
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

const displayPositiveFeedbackText = (type, i18nextInstance) => {
  elements.feedback.textContent = i18nextInstance.t(`${type}`);
};

const displayErrorFeedbackText = (error, i18nextInstance) => {
  if (error.startsWith('Unexpected')) {
    elements.feedback.textContent = i18nextInstance.t('unexpectedError', { error: `${error}` });
    return;
  }
  elements.feedback.textContent = i18nextInstance.t(`error.${error}`);
};

const displayPositiveFeedbackAppearance = () => {
  elements.feedback.classList.remove('text-danger');
  elements.feedback.classList.add('text-success');
};

const displayErrorFeedbackAppearance = () => {
  elements.feedback.classList.remove('text-success');
  elements.feedback.classList.add('text-danger');
};

const handleState = (state, i18nextInstance) => {
  switch (state) {
    case 'filling':
      elements.button.classList.remove('disabled');
      elements.input.classList.remove('is-invalid');
      elements.feedback.textContent = '';
      break;
    case 'validating':
      elements.button.classList.add('disabled');
      elements.input.setAttribute('disabled', '');
      break;
    case 'loading':
      displayPositiveFeedbackAppearance();
      displayPositiveFeedbackText('loadingProcess', i18nextInstance);
      break;
    case 'parsing':
      break;
    case 'success':
      elements.form.reset();
      elements.input.removeAttribute('disabled');
      elements.input.focus();
      displayPositiveFeedbackAppearance();
      displayPositiveFeedbackText('success', i18nextInstance);
      break;
    case 'error':
      displayErrorFeedbackAppearance();
      elements.input.removeAttribute('disabled');
      elements.input.focus();
      break;
    default:
      throw new Error(`Unknown processState - ${state}!`);
  }
};

const displayPosts = (posts, i18nextInstance, state) => {
  const { title, list } = elements.posts;
  title.textContent = i18nextInstance.t('postsTitle');
  list.innerHTML = '';

  const { UIstate: { watchedPostsIds } } = state;
  const postsData = Object.values(posts);
  postsData.map((post) => {
    const { url, title: titleOfPost, id } = post;

    const button = document.createElement('button');
    const btnClassName = 'btn btn-outline-primary btn-sm';
    button.className = btnClassName;
    button.textContent = 'Просмотр';
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    const a = document.createElement('a');
    const aClassName = watchedPostsIds.includes(id) ? 'fw-normal link-secondary' : 'fw-bold';
    a.className = aClassName;
    a.textContent = titleOfPost;
    a.setAttribute('href', url);
    a.setAttribute('data-id', id);
    a.setAttribute('rel', 'noopener noreferrer');
    a.setAttribute('target', '_blank');

    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0';
    li.append(a);
    li.append(button);
    return list.appendChild(li);
  });
};

const makeWatchedPostPale = (ids) => {
  const lastWatchedPostId = ids[ids.length - 1];
  const lastWatchedPost = document.querySelector(`a[data-id="${lastWatchedPostId}"]`);
  lastWatchedPost.className = 'fw-normal link-secondary';
};

const displayFeeds = (feeds, i18nextInstance) => {
  const { title, list } = elements.feeds;
  title.textContent = i18nextInstance.t('feedsTitle');
  list.innerHTML = '';

  const feedsData = Object.values(feeds);
  feedsData.map((feed) => {
    const { title: titleOfFeed, description } = feed;
    const li = document.createElement('li');
    li.className = 'list-group-item border-0 border-end-0';
    const html = `<h3 class="h6 m-0">${titleOfFeed}</h3><p class="m-0 small text-black-50">${description}</p>`;
    li.innerHTML = html;
    return list.appendChild(li);
  });
};

const putDataIntoModal = (data) => {
  const [title, description, url] = data;
  elements.modalTitle.textContent = title;
  elements.modalTextArea.textContent = description;
  elements.modalFullArticleButton.setAttribute('href', url);
};

const getRender = (i18nextInstance, state) => (path, value) => {
  const render = (pth, val) => {
    switch (pth) {
      case 'state':
        handleState(val, i18nextInstance);
        break;
      case 'errorMessage':
        displayErrorFeedbackText(val, i18nextInstance);
        break;
      case 'addedRSSData.posts':
        displayPosts(val, i18nextInstance, state);
        break;
      case 'addedRSSData.feeds':
        displayFeeds(val, i18nextInstance);
        break;
      case 'UIstate.watchedPostsIds':
        makeWatchedPostPale(val);
        break;
      case 'UIstate.modalData':
        putDataIntoModal(val);
        break;
      default:
        break;
    }
  };
  return render(path, value);
};

const makeStateWatched = (state, i18nextInst) => onChange(state, getRender(i18nextInst, state));

export { elements, makeStateWatched };
