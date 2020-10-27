import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useDispatch, useSelector } from "react-redux";
import { getUserLogged } from "../redux/actions/authActions";
import styles from "../Styles/indexStyles"

/* ------------------------------- COMPONENTS ------------------------------- */
// import AccountHistory from "./AccountHistory";
// import Contacts from "./Contacts";
import ForgotPass from "./ForgotPass";
import Home from "./Home";
import HomePosition from "./HomePosition/HomePosition";
import LogIn from "./LogIn";
// import MyCards from "./MyCards";
import Position from "./Position";
import RechargeMoney from "../views/RechargeMoney";
import SendMoney from "./SendMoney";
import SignupForm from "./SignUp/SignupForm";
import ResetPassword from "./ResetPassword";

/* ------------------------------- ADMIN ------------------------------- */
import AdminPanel from "./Admin/AdminPanel";

// import userStats from "./UserStats";

const LoggedFalseStack = createStackNavigator();
const LoggedTrueStack = createStackNavigator();

export default function Index() {
  const dispatch = useDispatch()
  const userLogged = useSelector((state) => state.auth);  

  useEffect(() => dispatch(getUserLogged()), []);
  return (

    <NavigationContainer>
      {        
        userLogged.user.role === undefined ?  
            <View style={[styles.container, styles.horizontal]}>
                <ActivityIndicator size={100} color="#382ab5" />
            </View>
        :
          userLogged.user.role === "guest" ? (
          <>
            <LoggedFalseStack.Navigator headerMode="none">
              <LoggedFalseStack.Screen name="home" component={Home} />
              <LoggedFalseStack.Screen name="login" component={LogIn} />
              <LoggedFalseStack.Screen name="sign" component={SignupForm} />
              <LoggedFalseStack.Screen
                name="forgotPass"
                component={ForgotPass}
              />
              <LoggedFalseStack.Screen
                name="resetPassword"
                component={ResetPassword}
              />
            </LoggedFalseStack.Navigator>
            </>
            )
          :
            (
              <>
              <LoggedTrueStack.Navigator headerMode="none">                
                {/* <LoggedTrueStack.Screen name="contacts" component={Contacts} />        
                <LoggedTrueStack.Screen name="myCards" component={MyCards} />         */}
                <LoggedTrueStack.Screen name="homePosition" component={HomePosition} />
                <LoggedTrueStack.Screen name="position" component={Position} />
                <LoggedTrueStack.Screen name="recharge" component={RechargeMoney} />
                <LoggedTrueStack.Screen name="sendMoney" component={SendMoney} />
                {/* <LoggedTrueStack.Screen name="accountHistory" component={AccountHistory} />
                <LoggedTrueStack.Screen name="userStats" component={userStats} /> */}
                <LoggedTrueStack.Screen name="adminPanel" component={AdminPanel} />
              </LoggedTrueStack.Navigator>
              </>
            )
          }
    </NavigationContainer>
  );
}

