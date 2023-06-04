import Amplify from '@aws-amplify/core';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { API, graphqlOperation } from 'aws-amplify';
import React, { useEffect, useState } from 'react';
import './App.css';
import logo from './logo.svg';
// import { DataStore, Predicates } from "@aws-amplify/datastore";
import awsConfig from './aws-exports';
import { PostStatus } from './models';

// import { GraphQLQuery } from '@aws-amplify/api';
// import { CreateTodoInput, CreateTodoMutation } from './API';
import * as mutations from './graphql/mutations';
import * as queries from './graphql/queries';
import * as subscriptions from './graphql/subscriptions';

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
  const response = await API.graphql({
    query: mutations.createPost,
    variables: { input: postDetails },
  });
  console.log('response=', response);
  // DataStore.save(
  //   new Post({
  //     title: `New title ${Date.now()}`,
  //     rating: (function getRandomInt(min, max) {
  //       min = Math.ceil(min);
  //       max = Math.floor(max);
  //       return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  //     })(1, 7),
  //     status: PostStatus.ACTIVE
  //   })
  // );
}

async function onQuery(setPosts) {
  // const posts = await DataStore.query(Post, c => c.rating.gt(4));
  const posts = await API.graphql({ query: queries.listPosts, variables: { filter: { rating: { gt: 4 } } } });
  setPosts(posts);
}

async function listPosts(setPosts) {
  // const posts = await DataStore.query(Post, Predicates.ALL);
  const posts = await API.graphql({ query: queries.listPosts });
  console.log('posts=', posts);
  setPosts(posts.data?.listPosts?.items);
}

function App({ signOut, user }) {
  const [posts, setPosts] = useState([]);

  async function onDeleteAll() {
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const p of posts) {
      console.log('Deleting post id=', p.id);
      API
      .graphql({ query: mutations.deletePost, variables: { input: { id: p.id } } })
      .then((response) => { console.log(response); }).catch((error) => { console.log(error); });
    }
    // DataStore.delete(Post, Predicates.ALL);
  }

  useEffect(() => {
    console.log('useEffect fired');

    listPosts(setPosts);

    // Subscribe to creation of Posts
    const sub = API.graphql(
      graphqlOperation(subscriptions.onCreatePost),
      // variables: { owner: user.username },
    ).subscribe({
      next: (newValue) => {
        console.log('sub next fired');
        console.log('newValue=', newValue);
        // console.log('provider=', provider);
        // console.log('value=', value);
        // console.log({ provider, value });
      },
      error: (error) => console.warn(error),
      complete: () => console.log('subscription complete'),
      onEstablished: () => console.log('subscription established'),
    });
    console.log('sub=', sub);

    // listPosts(setPosts);

    // const subscription = DataStore.observe(Post).subscribe(msg => {
    //   console.log(msg.model, msg.opType, msg.element);
    //   listPosts(setPosts);
    // });

    // const handleConnectionChange = () => {
    //   const condition = navigator.onLine ? 'online' : 'offline';
    //   console.log(condition);
    //   if (condition === 'online') { listPosts(setPosts); }
    // }

    // window.addEventListener('online', handleConnectionChange);
    // window.addEventListener('offline', handleConnectionChange);

    // return () => subscription.unsubscribe();
    // return () => sub.unsubscribe();
  }, []);

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
          {/* <input type="button" value="NEW" onClick={() => { onCreate(); listPosts(setPosts)} } /> */}
          <input
            type="button"
            value="NEW"
            onClick={() => {
              onCreate();
            }}
          />
          {/* <input type="button" value="DELETE ALL" onClick={() => { onDeleteAll(); listPosts(setPosts)} } /> */}
          <input
            type="button"
            value="DELETE ALL"
            onClick={() => {
              onDeleteAll();
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
              <td>Version</td>
            </tr>
          </thead>
          <tbody>
            {posts.map((item, i) => (
              <tr key={i}>
                <td>
                  {posts[i].id.substring(0, 8)}
                  ...
                </td>
                <td>{posts[i].title}</td>
                <td>{posts[i].rating}</td>
                {/* <td>{posts[i]._version}</td> */}
                <td>xd</td>
              </tr>
              ))}
          </tbody>
        </table>
      </header>
    </div>
  );
}

export default withAuthenticator(App);
