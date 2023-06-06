import Amplify from '@aws-amplify/core';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { API, graphqlOperation, Hub } from 'aws-amplify';
import React, { useEffect, useState } from 'react';
import './App.css';
import awsConfig from './aws-exports';
import * as mutations from './graphql/mutations';
import * as queries from './graphql/queries';
import * as subscriptions from './graphql/subscriptions';
import logo from './logo.svg';
import { PostStatus } from './models';

Amplify.configure(awsConfig);

async function onCreate() {
  const postDetails = {
    id: `Post-${Date.now()}`,
    title: `New title ${Date.now()}`,
    rating: (function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
    }(1, 7)),
    status: PostStatus.ACTIVE,
  };

  // DataStore.save(
  //   new Post(postDetails)
  // );

  const createResponse = await API.graphql({
    query: mutations.createPost,
    variables: { input: postDetails },
  });
  console.log('createResponse=', createResponse);
}

async function onQuery(setPosts) {
  // const posts = await DataStore.query(Post, c => c.rating.gt(4));
  const posts = await API.graphql({ query: queries.listPosts, variables: { filter: { rating: { gt: 4 } } } });
  setPosts(posts.data?.listPosts?.items);
}

async function onDeleteAll(posts) {
  // DataStore.delete(Post, Predicates.ALL);
  posts.forEach((p) => {
    API
    .graphql({ query: mutations.deletePost, variables: { input: { id: p.id } } })
    .then((response) => { console.log('deleteResponse=', response); }).catch((error) => { console.log(error); });
  });
}

async function listPosts(setPosts) {
  // const posts = await DataStore.query(Post, Predicates.ALL);
  const posts = await API.graphql({ query: queries.listPosts });
  console.log('listPosts=', posts);
  setPosts(posts.data?.listPosts?.items);
}

async function updatePost(post) {
  const newPost = {
    id: post.id,
    title: post.title,
    rating: post.rating,
    status: post.status,
   };
  newPost.title = `Updated title ${Date.now()}`;
  delete newPost.updatedAt;

  console.log('newPost=', newPost);
  const updateResponse = await API.graphql({ query: mutations.updatePost, variables: { input: newPost } });
  console.log('updateResponse=', updateResponse);
}

const subscribeTo = (subscriptionString, subscriptionName, setItems) => {
  const subscriptionClient = API.graphql(graphqlOperation(subscriptionString)).subscribe({
  next: (response) => {
    const newItem = response.value.data[subscriptionName];
    console.log('firedSubscription=', subscriptionName);

    switch (subscriptionName) {
      case subscriptionName.match(/^onCreate.*/)?.input:
        setItems((prevItems) => [...prevItems, newItem]);
        break;

      case subscriptionName.match(/^onUpdate.*/)?.input:
        setItems((prevItems) => prevItems.map((item) => (item.id === newItem.id ? newItem : item)));
        break;

      case subscriptionName.match(/^onDelete.*/)?.input:
        setItems((prevItems) => prevItems.filter((item) => item.id !== newItem.id));
        break;

      default:
        break;
    }
  },
  error: (error) => console.log('subError=', subscriptionName, error),
  complete: () => console.log('subComplete=', subscriptionName),
  onEstablished: () => console.log('subEstablished=', subscriptionName),
  });
  return subscriptionClient;
};

async function fullSubscription(modelName, setItems) {
  const res = await API.graphql({ query: queries[`list${modelName}s`] });
  setItems(res.data[`list${modelName}s`]?.items);
  const subs = [];
  subs.push(subscribeTo(subscriptions[`onCreate${modelName}`], `onCreate${modelName}`, setItems));
  subs.push(subscribeTo(subscriptions[`onUpdate${modelName}`], `onUpdate${modelName}`, setItems));
  subs.push(subscribeTo(subscriptions[`onDelete${modelName}`], `onDelete${modelName}`, setItems));
  return subs;
}

function App({ signOut, user }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const subs = [];
    console.log('user=', user);
    console.log('user.attributes.sub=', user.attributes.sub);
    console.log('useEffect fired');

    fullSubscription('Post', setPosts);

    // listPosts(setPosts);
    // subs.push(subscribeTo(subscriptions.onCreatePost, 'onCreatePost', setPosts));
    // subs.push(subscribeTo(subscriptions.onUpdatePost, 'onUpdatePost', setPosts));
    // subs.push(subscribeTo(subscriptions.onDeletePost, 'onDeletePost', setPosts));

    // Listen for appsync events
    Hub.listen('api', (data) => {
      const { payload } = data;
      console.log('event=', payload);
    });

    // const handleConnectionChange = () => {
    //   const condition = navigator.onLine ? 'online' : 'offline';
    //   console.log(condition);
    //   if (condition === 'online') { listPosts(setPosts); }
    // }

    // window.addEventListener('online', handleConnectionChange);
    // window.addEventListener('offline', handleConnectionChange);

    // return () => subscription.unsubscribe();
    // return () => postSubscription.unsubscribe();
    return () => {
      subs.forEach((subscription) => subscription.unsubscribe());
    };
  }, [user]);

  async function signOutFromApp() {
    // await DataStore.clear();
    signOut();
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>
          <h3>
            Hello
            {' '}
            {user.attributes.email}
            !
            <br />
            (
            {user.username}
            )
          </h3>
          <input
            type="button"
            value="NEW"
            onClick={() => {
              onCreate();
            }}
          />
          <input
            type="button"
            value="DELETE ALL"
            onClick={() => {
              onDeleteAll(posts);
            }}
          />
          <input
            type="button"
            value="QUERY rating > 4"
            onClick={() => {
              onQuery(setPosts);
            }}
          />
          <input
            type="button"
            value="ALL POST"
            onClick={() => {
              listPosts(setPosts);
            }}
          />
          <input
            type="button"
            value="SIGN OUT"
            onClick={() => {
              signOutFromApp();
            }}
          />
        </div>
        <table border="1">
          <thead>
            <tr>
              <td>Id</td>
              <td>Title</td>
              <td>Rating</td>
              <td>Status</td>
              <td>UpdatedAt</td>
              <td>Update</td>
            </tr>
          </thead>
          <tbody>
            {posts.map((item, i) => (
              <tr key={i}>
                <td>
                  {item.id.substring(0, 8)}
                  ...
                </td>
                <td>{item.title}</td>
                <td>{item.rating}</td>
                <td>{item.status}</td>
                <td>{item.updatedAt}</td>
                <td>
                  <input
                    type="button" value="modify"
                    onClick={() => {
                      updatePost(item);
                    }}
                  />
                </td>
              </tr>
              ))}
          </tbody>
        </table>
      </header>
    </div>
  );
}
export default withAuthenticator(App);
