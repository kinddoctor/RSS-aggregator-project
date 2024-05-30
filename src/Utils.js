import axios from 'axios';

const getUniqueId = () => Math.random().toString(36).substring(2, 6);

const hasRSS = (xml) => xml.children[0].localName === 'rss';

const makeUrlProxied = (url) => {
  const proxyHTTPAddress = 'https://allorigins.hexlet.app/get?disableCache=true&url=';
  const proxiedUrl = `${proxyHTTPAddress}${url}`;
  return proxiedUrl;
};

const loadData = (url) => {
  const proxiedUrl = makeUrlProxied(url);
  return axios.get(proxiedUrl);
};

const getValueOfField = (array, fieldName) => {
  const field = array.find((el) => el.nodeName === fieldName);
  return field.textContent;
};

const getNormalizedData = (xmlDoc) => {
  const rss = xmlDoc.children[0];
  const channel = rss.children[0];

  const feedData = Array.from(channel.children);
  const feedUrl = getValueOfField(feedData, 'link');
  const feedTitle = getValueOfField(feedData, 'title');
  const feedDescription = getValueOfField(feedData, 'description');
  const feed = {
    url: feedUrl,
    title: feedTitle,
    description: feedDescription,
  };

  const postsData = feedData.filter((el) => el.nodeName === 'item');
  const posts = postsData.reduce((acc, item) => {
    const postData = Array.from(item.children);
    const postUrl = getValueOfField(postData, 'link');
    const postTitle = getValueOfField(postData, 'title');
    const postDescription = getValueOfField(postData, 'description');
    const post = {
      url: postUrl,
      title: postTitle,
      description: postDescription,
    };
    return [...acc, ...post];
  }, []);

  return { feed, posts };
};

const parseData = (data) => {
  const parser = new DOMParser();
  let normalizedData;
  try {
    const parsedData = parser.parseFromString(data, 'text/xml');
    if (!hasRSS(parsedData)) {
      throw new Error('doesn`t has rss');
    }
    normalizedData = getNormalizedData(parsedData);
  } catch (e) {
    throw new Error('Parsing Error');
  }
  return normalizedData;
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
    // data from new axios-request with the same url (as in oldFeed)
    const newFeed = newFeeds.filter((feed) => feed.url === url)[0];
    if (postsIds.length === newFeed.postsIds.length) {
      renewedFeeds = { ...renewedFeeds, [id]: oldFeed };
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
    renewedFeeds = { ...renewedFeeds, [id]: oldFeed };
  });
  return { renewedFeeds, renewedPosts };
};

export {
  getUniqueId,
  getNormalizedData,
  getRenewedData,
  loadData,
  parseData,
  makeUrlProxied,
};
