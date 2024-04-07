import * as yup from 'yup';
import { elements, makeStateWatched } from './View.js';

const runApp = () => {
  const initialState = {
    addedRSSFeeds: [],
    addingRSSFeedProcess: {
      state: 'filling',
      valid: 'true',
      errors: [],
    },
  };
  const watchedState = makeStateWatched(initialState);

  const schema = yup.string().url().notOneOf(watchedState.addedRSSFeeds);

  const handleSubmit = (event) => {
    const promise = new Promise((resolve) => {
      event.preventDefault();
      watchedState.addingRSSFeedProcess.state = 'processing';
      const formData = new FormData(event.target);
      const url = formData.get('url');
      resolve(url);
    });
    promise
      .then((url) => schema.validate(url))
      .then((validUrl) => {
        watchedState.addingRSSFeedProcess.state = 'processed';
        watchedState.addingRSSFeedProcess.valid = 'true';
        watchedState.addedRSSFeeds.push(validUrl);
      })
      .catch((err) => {
        watchedState.addingRSSFeedProcess.state = 'processed';
        watchedState.addingRSSFeedProcess.valid = 'false';
        watchedState.addingRSSFeedProcess.errors.push(err);
      }); 
  };

  const handleChange = (e) => {
    watchedState.addingRSSFeedProcess.state = 'filling';
  };

  elements.input.addEventListener('input', handleChange);
  elements.form.addEventListener('submit', handleSubmit);
};

export default runApp;
