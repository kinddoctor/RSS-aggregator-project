import * as yup from 'yup';
import { elements, makeStateWatched } from './View.js';

const runApp = () => {
  const initialState = {
    addedRSSFeeds: [],
    addingRSSFeedProcess: {
      state: 'filling',
      value: '',
      valid: null,
      errors: [],
    },
  };
  const watchedState = makeStateWatched(initialState);

  const handleSubmit = (event) => {
    event.preventDefault();
    watchedState.addingRSSFeedProcess.state = 'processing';
    const url = watchedState.addingRSSFeedProcess.value;
    const promise = Promise.resolve(url);
    promise
      .then((url) => {
        const schema = yup.string().url().notOneOf(watchedState.addedRSSFeeds);
        return schema.validate(url);
      })
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

  const handleChange = ({ target }) => {
    const url = target.value;
    watchedState.addingRSSFeedProcess.value = url;
    watchedState.addingRSSFeedProcess.state = 'filling';
    watchedState.addingRSSFeedProcess.valid = null;
  };

  elements.input.addEventListener('input', handleChange);
  elements.form.addEventListener('submit', handleSubmit);
};

export default runApp;
