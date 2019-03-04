import { Injectable } from '@angular/core';
import { redux } from 'midgard-core';
import { composeWithDevTools } from 'redux-devtools-extension';
import { Observable } from 'rxjs';
import { apolloReducer } from '@libs/midgard-angular/src/lib/modules/graphql/apollo-cache-redux';
import { workflowlevel1Reducer } from '@libs/midgard-angular/src/lib/state/workflow-level1/workflow-level1.reducer';
import { workflowlevel2Reducer } from '@libs/midgard-angular/src/lib/state/workflow-level2/workflow-level2.reducer';
import { workflowlevel1Epics } from '@libs/midgard-angular/src/lib/state/workflow-level1/workflow-level1.epics';
import { workflowlevel2Epics } from '@libs/midgard-angular/src/lib/state/workflow-level2/workflow-level2.epics';
import { coreUserEpics } from '@libs/midgard-angular/src/lib/state/coreuser/coreuser.epics';
import { coreuserReducer } from '@libs/midgard-angular/src/lib/state/coreuser/coreuser.reducer';
import { authuserReducer } from '@libs/midgard-angular/src/lib/state/authuser/authuser.reducer';
import { authUserEpics } from '@libs/midgard-angular/src/lib/state/authuser/authuser.epics';
import { workflowteamsEpics } from '@libs/midgard-angular/src/lib/state/workflow-team/workflow-team.epics';
import { workflowTeamReducer } from '@libs/midgard-angular/src/lib/state/workflow-team/workflow-team.reducer';
import { topBarReducer } from '@libs/midgard-angular/src/lib/state/top-bar/top-bar.reducer';
import { productsReducer } from '@libs/products/src/lib/state/products.reducer';
import { productsEpics } from '@libs/products/src/lib/state/products.epics';
import {distinctUntilChanged} from 'rxjs/internal/operators';
import { contactsEpics } from '@libs/contacts/src/lib/state/contacts.epics';
import { documentsEpics } from '@libs/documents/src/lib/state/documents.epics';
import {contactsReducer} from '@libs/contacts/src/lib/state/contacts.reducer';
import {documentsReducer} from '@libs/documents/src/lib/state/documents.reducer';
import { dashboardsReducer } from '@libs/dashboards/src/lib/state/dashboards.reducer';
import { dashboardsEpics } from '@libs/dashboards/src/lib/state/dashboards.epics';
import { formsReducer } from '@libs/forms/src/lib/state/forms.reducer';
import { formsEpics } from '@libs/forms/src/lib/state/forms.epics';
let storeInstance: Store<any>;

@Injectable()
export class Store<T> {

  public observable: Observable<T>; // observable store
  subscribe: (listener: () => void) => {};
  dispatch: (action: any) => {};
  getState: () => any;

  constructor() {
    if (storeInstance) {
      return storeInstance;
    } else {
      const reducers = {
        apolloReducer,
        topBarReducer,
        coreuserReducer,
        authuserReducer,
        workflowTeamReducer,
        workflowlevel1Reducer,
        workflowlevel2Reducer,
        productsReducer,
        contactsReducer,
        documentsReducer,
        dashboardsReducer,
        formsReducer
      };
      const epics = [
        coreUserEpics,
        authUserEpics,
        workflowteamsEpics,
        workflowlevel1Epics,
        workflowlevel2Epics,
        productsEpics,
        documentsEpics,
        contactsEpics,
        dashboardsEpics,
        formsEpics
      ];
      const combinedReducers = redux.combineReducers(reducers); // combine the reducers to a reducer that can be used when creating the store
      const combinedEpics = redux.combineEpics(...epics); // combine redux-observable epics
      const epicMiddleware = redux.createEpicMiddleware(); // create an instance of redux-observable middleware
      const store = redux.createStore(
        combinedReducers,
        composeWithDevTools(
          redux.applyMiddleware(epicMiddleware),
          // other store enhancers if any
        )
      );
      epicMiddleware.run(combinedEpics); // activate redux-observable epics
      store.observable = this.toObservable();
      storeInstance = store;
      return store;
    }
  }

  /**
   * converts redux store to an Observable
   * @param {Store<any>} store - the redux store to be converted to observable
   * @returns {Observable<any>}
   */
  toObservable = (): Observable<any> => {
    return Observable.create(observer => {
      observer.next(storeInstance.getState()); // emits the inital value

      const dispose = storeInstance.subscribe(() => {
        observer.next(storeInstance.getState());
      });
      return dispose; // teardown function to unsubscribe to the observable
    });
  }
}

/**
 * a function that returns a stream of the state depending on a given selector
 * @param {Function} selector - memoized selector
 * @returns {<T>(source: Observable<T>) => Observable<T>}
 */
export const select = (selector: Function) => <T>(source: Observable<T>) =>
  new Observable<T>(observer => {
    return source.subscribe({
      next(state: any) {
        observer.next(selector(state));
      },
      error(err) { observer.error(err); },
      complete() { observer.complete(); }
    });
  }).pipe(distinctUntilChanged());

