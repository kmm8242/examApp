import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import type {RootStackParamList} from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import ExamListScreen from './src/screens/ExamListScreen';
import QuizScreen from './src/screens/QuizScreen';
import AppLockScreen from './src/screens/AppLockScreen';
import StatsScreen from './src/screens/StatsScreen';
import QuestionReviewScreen from './src/screens/QuestionReviewScreen';
import {ProgressProvider} from './src/store/ProgressContext';
import {ErrorBoundary} from './src/components/ErrorBoundary';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ErrorBoundary>
    <SafeAreaProvider>
      <ProgressProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {backgroundColor: '#fff'},
              headerTitleStyle: {fontWeight: '700', fontSize: 17},
              headerTintColor: '#4F46E5',
              headerShadowVisible: false,
            }}>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="ExamList"
              component={ExamListScreen}
              options={({route}) => ({title: route.params.examType})}
            />
            <Stack.Screen
              name="Quiz"
              component={QuizScreen}
              options={({route}) => ({
                title: route.params.subject ?? route.params.examType ?? 'Quiz',
              })}
            />
            <Stack.Screen
              name="AppLock"
              component={AppLockScreen}
              options={{title: 'App Lock'}}
            />
            <Stack.Screen
              name="Stats"
              component={StatsScreen}
              options={{title: 'Stats & History'}}
            />
            <Stack.Screen
              name="QuestionReview"
              component={QuestionReviewScreen}
              options={{title: 'Question Review'}}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ProgressProvider>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}
