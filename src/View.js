import onChange from 'on-change';

const displayPositiveFeedbackAppearance = ({ feedback }) => {
  feedback.classList.remove('text-danger');
  feedback.classList.add('text-success');
};

const displayErrorFeedbackAppearance = ({ feedback }) => {
  feedback.classList.remove('text-success');
  feedback.classList.add('text-danger');
};

const displayPositiveFeedbackText = (type, UIelements, i18nextInstance) => {
  const { feedback } = UIelements;
  feedback.textContent = i18nextInstance.t(`${type}`);
};

const displayErrorFeedbackText = (error, UIelements, i18nextInstance) => {
  const { feedback } = UIelements;
  if (error.startsWith('Unexpected')) {
    feedback.textContent = i18nextInstance.t('unexpectedError', { error: `${error}` });
    return;
  }
  feedback.textContent = i18nextInstance.t(`error.${error}`);
};

const handleState = (state, UIelements, i18nextInstance) => {
  const {
    form, button,
    input, feedback,
  } = UIelements;

  switch (state) {
    case 'filling':
      button.classList.remove('disabled');
      input.classList.remove('is-invalid');
      feedback.textContent = '';
      break;
    case 'validating':
      button.classList.add('disabled');
      input.setAttribute('disabled', '');
      break;
    case 'loading':
      displayPositiveFeedbackAppearance(UIelements);
      displayPositiveFeedbackText('loadingProcess', UIelements, i18nextInstance);
      break;
    case 'parsing':
      break;
    case 'success':
      form.reset();
      input.removeAttribute('disabled');
      input.focus();
      displayPositiveFeedbackAppearance(UIelements);
      displayPositiveFeedbackText('success', UIelements, i18nextInstance);
      break;
    case 'error':
      displayErrorFeedbackAppearance(UIelements);
      input.removeAttribute('disabled');
      input.focus();
      break;
    default:
      throw new Error(`Unknown processState - ${state}!`);
  }
};

const displayPosts = (posts, state, UIelements, i18nextInstance) => {
  const { posts: { title, list } } = UIelements;
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

const displayFeeds = (feeds, UIelements, i18nextInstance) => {
  const { feeds: { title, list } } = UIelements;
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

const putDataIntoModal = (data, UIelements) => {
  const [title, description, url] = data;
  const { modalTitle, modalTextArea, modalFullArticleButton } = UIelements;
  modalTitle.textContent = title;
  modalTextArea.textContent = description;
  modalFullArticleButton.setAttribute('href', url);
};

const getRender = (state, UIelements, i18nextInstance) => (path, value) => {
  const render = (pth, val) => {
    switch (pth) {
      case 'state':
        handleState(val, UIelements, i18nextInstance);
        break;
      case 'errorMessage':
        displayErrorFeedbackText(val, UIelements, i18nextInstance);
        break;
      case 'addedRSSData.posts':
        displayPosts(val, state, UIelements, i18nextInstance);
        break;
      case 'addedRSSData.feeds':
        displayFeeds(val, UIelements, i18nextInstance);
        break;
      case 'UIstate.watchedPostsIds':
        makeWatchedPostPale(val);
        break;
      case 'UIstate.modalData':
        putDataIntoModal(val, UIelements);
        break;
      default:
        break;
    }
  };
  return render(path, value);
};

const makeStateWatched = (state, UIelements, i18nextInst) => (
  onChange(state, getRender(state, UIelements, i18nextInst))
);

export default makeStateWatched;
