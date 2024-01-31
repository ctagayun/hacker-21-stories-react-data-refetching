/*================================================================
 Explicit Data Fetching Using Axios
    
   Task: 
     Not all browser supports "fetch". 

     One alternative is to substitute the native fetch API with a 
   stable library like axios, which performs asynchronous requests 
   to remote APIs. In this section, we will discover how to substitute 
   a library -- a native API of the browser in this case -- with another 
   library from the npm registry.
   
   Optional Hints Explicit Data Fetching Using Axios:
     - run npm install axios in command line

     - add import statement: 
         import axios from 'axios'; 

     - modify handleFetchStories;

   Previous Task Explicit Data Fetching: 
       The server-side search executes every time a user types into 
   the input field. The new implementation should only execute a search 
   when a user clicks a confirmation button. As long as the button is 
   not clicked, the search term can change but isn't executed as 
   API request.

   Previous Task: (from prev section memoizing) Kept it here so that I wont forget.
     We will refactor the code upfront to use a memoized 
   function and provide the explanations afterward. The refactoring 
   consists of moving all the data fetching logic from the 
   side-effect into a arrow function expression (A), wrapping this 
   new function into React's useCallback hook (B), and invoking 
   it in the useEffect hook (C):

  Optional Hints Explicit Data Fetching:
    - 
    - (AA) Add a button element to confirm the search request.
      But first of all, create a new button element which confirms 
      the search and executes the data request eventually (AA)

    - (BB) rename handler 'handleSearch' to handleSearchInput. 
     
      (CC)Create a a handler for the button which sets the new 
      state value. The button's event handler sets confirmed search as 
      state by using the current search term.  
         
    - Only when the new confirmed search is set as state, 
      execute the side-effect to perform a server-side search.
 
    - (DD) after creating a handler for the button, create a state 
      called 'url' using the API and concatenated with the value of the 
      search input box
           const [url, setUrl] = React.useState(
              `${API_ENDPOINT}${searchTerm}`);

     - (EE) Instead of running the data fetching side-effect on 
      every searchTerm change (which happens each time the 
      input field's value changes like we have seen before), 
      the new stateful url is used whenever a user changes it 
      by confirming a search request when clicking the button:

      TO TEST: enter search criteria and click Submit button
     
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
import axios from 'axios';

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

  //(DD) new handler of the button sets the new stateful value 
  //called 'url' which is derived from the current searchTerm and 
  //the static API endpoint as a new state:
  const [url, setUrl] = React.useState(
    `${API_ENDPOINT}${searchTerm}`
  );

  /*   Memoized useEffect
    After merging the three useState hooks into one Reducer hook,
  we cannot use the state updater functions from React's 
  useState Hooks anymore like:
       setIsLoading, setIsError
  everything related to asynchronous data fetching must now use 
  the new dispatch function "dispatchStories" see (A)
  for updating state transitions 

  React.useEffect(() => {

     if `searchTerm` is not present
      e.g. null, empty string, undefined
      do nothing
      more generalized condition than searchTerm === '' 

    if (!searchTerm) return;
     dispatchStories receiving different payload
     dispatchStories({ type: 'STORIES_FETCH_INIT' }); //for init
                     //dispatchStories receives STORIES_FETCH_INIT as type

    First - API is used to fetch popular tech stories for a certain query 
            (a search term). In this case  we fetch stories about 'react' (B)

    Second - the native browser's fetch API (see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
             to make this request.
             For 'fetch' API, the response needs to be translated to JSON (C)
    
    Finally - the returned result has a different data structure which we send
              payload to our component's state reducer (dispatchStories)
   
    We need to migrate the search to server-side search
    Instead of using the hardcoded search term (here: 'react'), use the 
    actual searchTerm from the component's state like the following code.

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
                       searchTerm changes, we would have to include it in 
                      the dependency array:
  */

  //Memoized the above useEffect() by using useCallBack hook.
  //The refactoring consists of:
  // 1. moving all the data fetching logic from the side-effect 
  //    into a arrow function expression (A)
  // 2. Then wrapping this new function into React.useCallback (B)
  // 3. and invoking it in the useEffect hook (C):
  
  //  1. Mainly what we did is to extract a function from React's useEffect Hook
  //     commented out above. Instead of using the data fetching logic directly 
  //     in the side-effect , we made it available as a function for the 
  //     entire application.
  //     The benefit: reusability. The data fetching can be used by other parts 
  //     of the application by calling this new function. (A)
  //
  //   2. We wrapped the whole function using useCallBack hook (B)
  //      useCallBack function hook creates a memoized function
  //      every time its dependency array (E) changes as result 
  //      useEffect hook  handleFetchStories() runs again (C)
  //      because it depends on the new memoized function "handleFetchStories"

  // A 
  
  const handleFetchStories = React.useCallback(() => { // B
    if (!searchTerm) return;
 
    dispatchStories({ type: 'STORIES_FETCH_INIT' });
 
    //fetch(`${API_ENDPOINT}${searchTerm}`)
    //fetch(url) //DD use the stateful 'url'
    axios
      .get(url) //call axios.get() for HTTP GET use the stateful 'url'
      .then((result) => {
        dispatchStories({
          type: 'STORIES_FETCH_SUCCESS',
          payload: result.data.hits,
        });
      })
      .catch(() =>
        dispatchStories({ type: 'STORIES_FETCH_FAILURE' })
      );
     // [searchTerm])  with 'url (DD)
  }, [url]) //replace 'searhTerm' with stateful 'url' 
       const myDependencyArray = JSON.stringify(searchTerm);
       console.log("dependency array SearchTerm value = " + myDependencyArray);
        ; //EOF //E - every time searchTerm dependency array (E) changes 
                    //useCallback Hook creates a memoized function. As a
                    //result React.useEffect runs again (C) because it depends 
                    //on the new function (D)

                    //React's useCallback hook changes the function only 
                    //when one of its values in the dependency array (E) changes. 
                    //That's when we want to trigger a re-fetch of the data, 
                    //because the input field has new input and we want to see 
                    //the new data displayed in our list.
                    //Note: the dependency array contains the stuff we type in 
                    //the input field

  //useEffect executes every time [searchTerm] dependency array (E) changes.
  //As a result it runs again the memoized function (C) because it depends
  //on the new function "handleFetchStories" (D)
  React.useEffect(() => { 
    handleFetchStories(); // C
  }, [handleFetchStories]); // D   (EOF)

  
  const handleRemoveStory = (item) => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item,
    });
  };  //EOF handleRemoveStory

 

  //(BB) rename handler handleSearch to handleSearchInput
  ///renamed handler of the input field still sets 
  //the stateful searchTerm,
  const handleSearchInput = (event) => {
    setSearchTerm(event.target.value);
  };

  //(CC) create new handler for the button.
  //While the renamed handler of the input field still sets 
  //the stateful searchTerm ... the new handler of the button 
  //sets the new stateful value called 'url' which is derived 
  //from the current searchTerm and the static API endpoint 
  //as a new state
  const handleSearchSubmit = () => {  //CC
    setUrl(`${API_ENDPOINT}${searchTerm}`);
  };

  
   return (
    <div>
      <h1>My Hacker Stories</h1>

      <InputWithLabel
        id="search"
        value={searchTerm}
        isFocused
        onInputChange={handleSearchInput} //BB
      >
        <strong>Search:</strong>
      </InputWithLabel>

      <button //(AA) this button confirms the search and executes the data request.
        type="button"
        disabled={!searchTerm}
        onClick={handleSearchSubmit} //CC
      >
        Submit
      </button>
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