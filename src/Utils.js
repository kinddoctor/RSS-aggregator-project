import axios from 'axios';

const getValueOfField = (array, fieldName) => {
  const field = array.find((el) => el.nodeName === fieldName);
  return field.innerHTML;
};

const getUniqueId = () => Math.random().toString(36).substring(2, 6);

const getNormalizedData = (xmlDoc) => {
  const rss = xmlDoc.children[0];
  const channel = rss.children[0];

  const feedData = Array.from(channel.children);
  const feedTitle = getValueOfField(feedData, 'title');
  const feedDescription = getValueOfField(feedData, 'description');
  const feedUrl = getValueOfField(feedData, 'link');
  const feedId = getUniqueId();
  const feedContent = {
    id: feedId,
    url: feedUrl,
    title: feedTitle,
    description: feedDescription,
    postsIds: [],
  };

  const postsData = feedData.filter((el) => el.nodeName === 'item');
  const posts = postsData.reduce((acc, item) => {
    const postData = Array.from(item.children);
    const postTitle = getValueOfField(postData, 'title');
    const postUrl = getValueOfField(postData, 'link');
    const postId = getUniqueId();
    const post = {
      id: postId,
      feedId,
      url: postUrl,
      title: postTitle,
    };
    feedContent.postsIds.push(postId);
    return { ...acc, [postId]: post };
  }, {});

  return { feed: { [feedId]: feedContent }, posts };
};

const loadDataFromUrl = (url) => {
  const proxyHTTPAddress = 'https://allorigins.hexlet.app/get?disableCache=true&url=';
  const proxiedUrl = `${proxyHTTPAddress}${url}`;
  return axios.get(proxiedUrl);
};

const parseData = (data) => {
  const parser = new DOMParser();
  let parsedData;
  try {
    parsedData = parser.parseFromString(data.contents, 'text/xml');
  } catch (e) {
    e.name = 'ParseError';
    throw e;
  }
  return parsedData;
};

export { getNormalizedData, loadDataFromUrl, parseData };
