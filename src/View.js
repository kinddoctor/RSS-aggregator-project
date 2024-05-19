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

const displayErrorText = (error, process, i18nextInstance) => {
  elements.feedback.textContent = i18nextInstance.t(`${process}.errors.${error}`);
};

const displaySuccessFeedbackText = (process, i18nextInstance) => {
  elements.feedback.textContent = i18nextInstance.t(`${process}.success`);
};

const dislayPositiveFeedbackAppearance = () => {
  elements.feedback.classList.remove('text-danger');
  elements.feedback.classList.add('text-success');
};

const dislayNegativeFeedbackAppearance = () => {
  elements.feedback.classList.remove('text-success');
  elements.feedback.classList.add('text-danger');
};

const handleFormState = (processState) => {
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
      dislayPositiveFeedbackAppearance();
      displaySuccessFeedbackText('validation', i18nextInstance);
      break;
    case 'unvalid':
      elements.input.classList.add('is-invalid');
      dislayNegativeFeedbackAppearance();
      break;
    default:
      break;
  }
};

const handleLoadingState = (state, i18nextInstance) => {
  switch (state) {
    case 'loading':
      elements.feedback.textContent = i18nextInstance.t('loading.processing');
      break;
    case 'loaded':
      elements.feedback.textContent = i18nextInstance.t('loading.success');
      break;
    case 'failed':
      dislayNegativeFeedbackAppearance();
      break;
    default:
      break;
  }
};

const handleParsingState = (state) => {
  switch (state) {
    case 'failed':
      dislayNegativeFeedbackAppearance();
      break;
    case 'parsing':
    case 'parsed':
    default:
      break;
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
      case 'form.state':
        handleFormState(val);
        break;
      case 'form.validation.state':
        handleValidationState(val, i18nextInstance);
        break;
      case 'form.validation.error':
        displayErrorText(val, 'validation', i18nextInstance);
        break;
      case 'loadingProcess.state':
        handleLoadingState(val, i18nextInstance);
        break;
      case 'loadingProcess.error':
        displayErrorText(val, 'loading', i18nextInstance);
        break;
      case 'parsingProcess.state':
        handleParsingState(val);
        break;
      case 'parsingProcess.error':
        displayErrorText(val, 'parsing', i18nextInstance);
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
