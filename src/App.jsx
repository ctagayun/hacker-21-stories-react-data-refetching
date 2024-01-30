/*================================================================
 React Data Re-Fetching
   Task:  
      The search feature is a client-side search, because it 
   filters only the data that's already there. Instead it should be 
   possible to use the search to fetch data related to the search term.

      There are not many steps involved to migrate the application 
    from a client-side to a server-side search

  Optional Hints:
     - Use this https://hn.algolia.com/api/v1/search?query=React 
     API endpoint of the Hacker News API

     - Remove the initialStories variable, because this data will 
     come from the API.

     - remove getAsyncStories because will fetch the data directly from the API.
     - Use the browser's native fetch API to perform the request.

     - Note: A successful or erroneous request uses the same 
     implementation logic that we already have in place.

     - The derived value searchedStories can be removed, because we expect the 
     data to come filtered from the API. 
     
     - For the data fetching, the hardcoded 'react' needs to get replaced 
     by the searchTerm. Handle the edge case when searchTerm is an empty string.


  Review what is useState?
      - https://www.robinwieruch.de/react-usestate-hook/

      - When a state gets mutated, the component with the state 
      and all child components will re-render.

      - Use the browser's native fetch API to perform the request.

      - Note: A successful or erroneous request uses the same 
      implementation logic that we already have in place.
      
  Review what is useEffect?
    - https://www.robinwieruch.de/react-useeffect-hook/
    
    - What does useEffect do? by using this hook you tell React that 
     your component needs to do something after render.

  Review what is a React.Reducer
    - https://www.robinwieruch.de/javascript-reducer/

=============================================*/
import * as React from 'react';

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

/* No need for this because we will fetch data directly using the API
const getAsyncStories = () =>
  new Promise((resolve) =>
    setTimeout(
      () => resolve({ data: { stories: initialStories } }),
      2000
    )
  ); */

//Again the first thing to do when using React.useReducer hook
//is to define a reducer function outside of the component.
//A reducer function always receives a state and an action. 
//Based on these two arguments, returns a new state.

/* 
 We changed two things from the above original reducer function. 
   1. First, we introduced new types when we called the dispatch 
      function from the outside. 
      Therefore we need to add the following new cases for state transitions.
         'STORIES_FETCH_INIT' 
         'STORIES_FETCH_SUCCESS'
         'STORIES_FETCH_FAILURE'
         'REMOVE_STORY'
         throw new Error();
   2. Second, we changed the state structure from an array to 
      a complex object. Therefore we need to take the new complex 
      object into account as incoming state and returned state:

   3.For every state transition, we return a new state object 
     which contains all the key/value pairs from the current 
     state object (via JavaScript's spread operator ...state) and 
     the new overwriting properties 
     
     For example, STORIES_FETCH_FAILURE sets the 
     isLoading boolean to false and sets the isError boolean 
     to true, while keeping all the the other state intact 
     (e.g. data alias stories)
*/
const storiesReducer = (state, action) => {
  switch (action.type) {
    case 'STORIES_FETCH_INIT': //distinct type and payload 
                               //received by dispatchStories 
                               //dispatch function
                               //so we need to add it here
      return {
        ...state,              //return new state object with KV pairs
                               //via spread operator from current state object
        isLoading: true,
        isError: false,
      };
    case 'STORIES_FETCH_SUCCESS': //distinct type and payload 
                                  //received by dispatchStories 
                                  //dispatch function
                                  //so we need to add it here
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case 'STORIES_FETCH_FAILURE':   //another distinct type and payload 
                                    //received by dispatchStories 
                                    //dispatch function 
                                    //so we need to add it here
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case 'REMOVE_STORY':              //another distinct type and payload 
                                      //received by dispatchStories 
                                      //dispatch function
                                      //so we need to add it here
                                  //Observe how the REMOVE_STORY action 
                                  //changed as well. It operates on the 
                                  //state.data, and no longer just on the
                                  // plain "state".
      return {
        ...state,
        data: state.data.filter(  //now operate on state.data not just "state"
          (story) => action.payload.objectID !== story.objectID
        ),
      };
    default:
      throw new Error();
  }
};

const useStorageState = (key, initialState) => {
  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  );

  React.useEffect(() => {
    localStorage.setItem(key, value);
  }, [value, key]);

  return [value, setValue];
};

const App = () => {
  const [searchTerm, setSearchTerm] = useStorageState(
    'search',
    'React'
  );

  /*
    Take the following hooks: And merge them into one useReducer 
 hook for a unified state. Because technically, all states related 
 to the asynchronous data belong together, which doesn't only 
 include the stories as actual data, but also their loading and 
 error states.
    That's where one reducer and React's useReducer Hook come 
 into play to manage domain related states.

      const App = () => {
      ...
      const [stories, dispatchStories] = React.useReducer(
        storiesReducer,
        []
      );
      const [isLoading, setIsLoading] = React.useState(false);
      const [isError, setIsError] = React.useState(false);
      ...
    };
  */

   //data: [], isLoading, isError flags hooks merged into one 
   //useReducer hook for a unified state.
  const [stories, dispatchStories] = React.useReducer( //A
    storiesReducer,
    { data: [], isLoading: false, isError: false } //We want an empty list data [] 
                                                   //for the initial state, set isloading=false
                                                   //is error=false
  );

  //After merging the three useState hooks into one Reducer hook,
  //we cannot use the state updater functions from React's 
  //useState Hooks anymore like:
  //     setIsLoading, setIsError
  //everything related to asynchronous data fetching must now use 
  //the new dispatch function "dispatchStories" see (A)
  //for updating state transitions 
  React.useEffect(() => {

    // if `searchTerm` is not present
    // e.g. null, empty string, undefined
    // do nothing
    // more generalized condition than searchTerm === ''
    if (!searchTerm) return;

     //dispatchStories receiving different payload
    dispatchStories({ type: 'STORIES_FETCH_INIT' }); //for init
                     //dispatchStories receives STORIES_FETCH_INIT as type

    //First - API is used to fetch popular tech stories for a certain query 
    //        (a search term). In this case  we fetch stories about 'react' (B)

    //Second - the native browser's fetch API (see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
    //         to make this request.
    //         For 'fetch' API, the response needs to be translated to JSON (C)
    
    //Finally - the returned result has a different data structure which we send
    //          payload to our component's state reducer (dispatchStories)
   
    //We need to migrate the search to server-side search
    //Instead of using the hardcoded search term (here: 'react'), use the 
    //actual searchTerm from the component's state like the following code.

    //change fetch(`${API_ENDPOINT} react`) query parameter to {searchTerm}
    fetch(`${API_ENDPOINT}${searchTerm}`) // B
      .then((response) => response.json()) // C
      .then((result) => {
         dispatchStories({
           type: 'STORIES_FETCH_SUCCESS',
           payload: result.hits, //D
         });
      })
      .catch(() =>
        dispatchStories({type:'STORIES_FETCH_FAILURE'})
      );
    }, [searchTerm]); //If we would want to run the side-effect also when the
                      // searchTerm changes, we would have to include it in 
                      //the dependency array:
  
  const handleRemoveStory = (item) => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item,
    });
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

   return (
    <div>
      <h1>My Hacker Stories</h1>

      <InputWithLabel
        id="search"
        value={searchTerm}
        isFocused
        onInputChange={handleSearch}
      >
        <strong>Search:</strong>
      </InputWithLabel>

      <hr />

      {stories.isError && <p>Something went wrong ...</p>}

      {stories.isLoading ? (
        <p>Loading ...</p>
      ) : (
        <List
          //list={searchedStories} //First, remove searchedStories because we will 
                                   //receive the stories filtered by search term 
                                   //from the API. Pass only the regular stories 
                                   //to the List component:
          list={stories.data}
          onRemoveItem={handleRemoveStory}
        />
      )}
    </div>
  );
};

const InputWithLabel = ({
  id,
  value,
  type = 'text',
  onInputChange,
  isFocused,
  children,
}) => {
  const inputRef = React.useRef();

  React.useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  return (
    <>
      <label htmlFor={id}>{children}</label>
      &nbsp;
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={onInputChange}
      />
    </>
  );
};

const List = ({ list, onRemoveItem }) => (
  <ul>
    {list.map((item) => (
      <Item
        key={item.objectID}
        item={item}
        onRemoveItem={onRemoveItem}
      />
    ))}
  </ul>
);

const Item = ({ item, onRemoveItem }) => (
  <li>
    <span>
      <a href={item.url}>{item.title}</a>
    </span>
    <span>{item.author}</span>
    <span>{item.num_comments}</span>
    <span>{item.points}</span>
    <span>
      <button type="button" onClick={() => onRemoveItem(item)}>
        Dismiss
      </button>
    </span>
  </li>
);

export default App;

//========================================================== 
 //Note on Map:
 //Within the map() method, we have access to each object and its properties.
 
 //useState
 //By using useState, we are telling React that we want to have a 
 //stateful value which changes over time. And whenever this stateful value 
 //changes, the affected components (here: Search component) 
 //will re-render to use it (here: to display the recent value).

 /* 
     The filter() method takes a function 
        as an argument, which accesses each item in the array and returns /
        true or false. If the function returns true, meaning the condition is 
        met, the item stays in the newly created array; if the function 
        returns false, it's removed from the filtered array.

  
 */
 
 /*Note on Map:
   Within the map() method, we have access to each object and its properties.

 // concatenating variables into a string
    var fullName = `${firstName} ${lastName}`
    console.log(fullName);


 //useState
    By using useState, we are telling React that we want to have a 
 stateful value which changes over time. And whenever this stateful value 
 changes, the affected components (here: Search component) 
 will re-render to use it (here: to display the recent value).

  //Work flow of a useState:
       When the user types into the input field, the input field's change event 
      runs into the event handler. The handler's logic uses the event's value 
      of the target and the state updater function to set the updated state. 
      Afterward, the component re-renders (read: the component function runs). 
      The updated state becomes the current state (here: searchTerm) and is 
      displayed in the component's JSX.

  //Arrow Function
    function getTitle(title) { - convert to arrow function see below
    
    const getTitle =(title) => 
       (
        title
       );

    Eliminate bracket and "return" statement if no business logic before 
    the function - concise
   

  //Arrow function - 
   If there is a business business logic. Otherwise retain the {} and
   put a "return" statement 
     const App = () => {
       ...
       return xyz;
     } 
 
  //How to use a React.Reducer hook 
  To use Reducer (1) first define a reducer function.
     1. A reducer action is always associated with a type. As best 
        practice with a payload.
        Example:
          const storiesReducer = (state, action) =>{
          if (action.type === 'SET_STORIES'){
            //If the type matches a condition in the reducer. Return a new
            //state based on the incoming state and action
            return action.payload;
          }
          else{
          //throw an error if isn't covered by the reducer to remind yourself
          //that the implementation is not covered
            throw new Error();
          }
        }
      2. The second thing to do is to replaceReact.useState to use a reducer hook
         like this: 

          const [stories, dispatchStories] = React.useReducer(storiesReducer,[]);

          1. receives a reducer function called "storiesReducer"
          2. receives an initial state of empty array []
          3. returns an array with 2 item: 
            - The first item is "stories" which is the current state
            - The second item is the updater function named "dispatchStories"
            Unlike useState, the updater function of Reducer sets the state
            "implicitly" by dispatching an "action". Example:
               dispatchStories({
                 type: 'SET_STORIES',   <== this is the action
               payload: result.data.stories,
             });
       
 */