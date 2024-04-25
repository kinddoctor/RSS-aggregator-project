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
  const feed = {
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
    feed.postsIds.push(postId);
    return { ...acc, [postId]: post };
  }, {});

  return { feed, posts };
};

export default getNormalizedData;
