import * as yup from 'yup';
import { elements, makeStateWatched } from './View.js';

const runApp = () => {
  const initialState = {
    addedRSSFeeds: [],
    addingRSSFeedProcess: {
      state: 'filling',
      value: '',
      validationState: null,
      errors: [],
    },
  };
  const watchedState = makeStateWatched(initialState);

  const handleSubmit = (event) => {
    event.preventDefault();
    watchedState.addingRSSFeedProcess.state = 'processing';
    const urlString = watchedState.addingRSSFeedProcess.value;
    const promise = Promise.resolve(urlString);
    promise
      .then((url) => {
        const schema = yup.string().url().notOneOf(watchedState.addedRSSFeeds);
        return schema.validate(url);
      })
      .then((validUrl) => {
        watchedState.addingRSSFeedProcess.state = 'processed';
        watchedState.addingRSSFeedProcess.validationState = 'valid';
        watchedState.addedRSSFeeds.push(validUrl);
      })
      .catch((err) => {
        if (err.message === 'this must be a valid URL') {
          watchedState.addingRSSFeedProcess.validationState = 'unvalidUrl';
        } else if (err.message.startsWith('this must not be one of the following values')) {
          watchedState.addingRSSFeedProcess.validationState = 'existingUrl';
        } else {
          throw new Error(`Unknown validation error - ${err}`);
        }
        watchedState.addingRSSFeedProcess.state = 'processed';
        watchedState.addingRSSFeedProcess.errors.push(err);
      });
  };

  const handleChange = ({ target }) => {
    const url = target.value;
    watchedState.addingRSSFeedProcess.value = url;
    watchedState.addingRSSFeedProcess.state = 'filling';
    watchedState.addingRSSFeedProcess.validationState = null;
  };

  elements.input.addEventListener('input', handleChange);
  elements.form.addEventListener('submit', handleSubmit);
};

export default runApp;
