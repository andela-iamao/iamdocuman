import axios from 'axios';

/**
* searchUser
* @param {number} limit - max number to return
* @param {number} offset - index to start from
* @param {string} query - string to search for
* @return {object} action to send to reducers
*/
export function searchUser(limit = 9, offset = 0, query) {
  return (dispatch) => {
    axios.get(
      `/api/v1/search/users/?q=${query}&limit=${limit}&offset=${offset}`)
      .then((response) => {
        dispatch({
          type: 'USERS_SEARCH_RESULT',
          payload: response.data
        });
      })
      .catch(() => {
        dispatch({
          type: 'NOT_FOUND_USERS'
        });
      });
  };
}


/**
* searchDocs
* @param {number} limit - max number to return
* @param {number} offset - index to start from
* @param {string} query - string to search for
* @return {object} action to send to reducers
*/
export function searchDocs(limit = 9, offset = 0, query) {
  return (dispatch) => {
    axios.get(
      `/api/v1/search/documents/?q=${query}&limit=${limit}&offset=${offset}`)
      .then((response) => {
        dispatch({
          type: 'DOCUMENTS_SEARCH_RESULT',
          payload: response.data
        });
      })
      .catch(() => {
        dispatch({
          type: 'NOT_FOUND_DOCS'
        });
      });
  };
}

/**
* clearSearch
* @return {object} action to send to reducers
*/
export function clearSearch() {
  return {
    type: 'CLEAR_SEARCH'
  };
}


/**
 * changeSearchPage
 * @param {number} pageNum - page number
 * @return {object} action to send to all reducers
 */
export function changeSearchPage(pageNum) {
  return {
    type: 'CHANGE_SEARCH_PAGE',
    payload: pageNum
  };
}
