import React from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';
import ProfilePage from "../pages/profile";

export const Routes = props  => {
    return (
        <Switch>
            { props.routes.map(
                (route, idx) => <Route exact key={idx} path={route.path} render={withRouter(route.page)} />
              )
            }
            <Route exact path="/" render={withRouter(ProfilePage)} />
        </Switch>
    );
};