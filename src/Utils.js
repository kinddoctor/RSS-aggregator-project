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
    const postDescription = getValueOfField(postData, 'description');
    const postUrl = getValueOfField(postData, 'link');
    const postId = getUniqueId();
    const post = {
      id: postId,
      feedId,
      url: postUrl,
      title: postTitle,
      description: postDescription,
    };
    feedContent.postsIds.push(postId);
    return { ...acc, [postId]: post };
  }, {});

  return { feed: { [feedId]: feedContent }, posts };
};

const makeUrlProxied = (url) => {
  const proxyHTTPAddress = 'https://allorigins.hexlet.app/get?disableCache=true&url=';
  const proxiedUrl = `${proxyHTTPAddress}${url}`;
  return proxiedUrl;
};

const loadDataFromUrl = (url) => {
  const proxiedUrl = makeUrlProxied(url);
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

const getRenewedData = (oldData, newData) => {
  const { feeds: feedsOldData, posts: postsOldData } = oldData;
  const { feeds: feedsNewData, posts: postsNewData } = newData;
  let renewedFeeds = {};
  let renewedPosts = { ...postsOldData };

  const oldFeeds = Object.values(feedsOldData);
  const newFeeds = Object.values(feedsNewData);
  const newPosts = Object.values(postsNewData);
  oldFeeds.forEach((oldFeed) => {
    const { url, id, postsIds } = oldFeed;
    const newFeed = newFeeds.filter((feed) => feed.url === url)[0]; // data from new axios-request with the same url (as in oldFeed)
    if (postsIds.length === newFeed.postsIds.length) {
      renewedFeeds = { ...renewedFeeds, id: oldFeed };
      return;
    }
    const oldFeedPostsTitles = postsIds.map((postId) => postsOldData[postId].title);
    const newFeedPosts = newPosts.filter((post) => newFeed.postsIds.includes(post.id));
    const postsToAdd = newFeedPosts.filter((post) => !oldFeedPostsTitles.includes(post.title));
    postsToAdd.forEach((post) => {
      postsIds.push(post.id);
      const newPost = { ...post, feedId: id };
      renewedPosts = { ...renewedPosts, [post.id]: newPost };
    });
    renewedFeeds = { ...renewedFeeds, id: oldFeed };
  });
  return { renewedFeeds, renewedPosts };
};

export {
  getNormalizedData,
  getRenewedData,
  loadDataFromUrl,
  parseData,
  makeUrlProxied,
};
