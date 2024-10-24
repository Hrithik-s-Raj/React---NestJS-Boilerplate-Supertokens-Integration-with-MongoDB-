import SuperTokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import ThirdParty from 'supertokens-node/recipe/thirdparty';
import Passwordless from 'supertokens-node/recipe/passwordless';
import Session from 'supertokens-node/recipe/session';
import Dashboard from 'supertokens-node/recipe/dashboard';
import UserRoles from 'supertokens-node/recipe/userroles';
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
client.connect();
const db = client.db('mydatabase'); 
const usersCollection = db.collection('users');

export const appInfo = {
  appName: 'ST',
  apiDomain: 'http://localhost:3001',
  websiteDomain: 'http://localhost:3000',
  apiBasePath: '/auth',
  websiteBasePath: '/auth',
};

// Supertokens connection URI
export const connectionUri = 'https://try.supertokens.com';

// Supertokens recipe list configuration
export const recipeList = [
  EmailPassword.init({
    override: {
      functions: (originalImplementation) => {
        return {
          ...originalImplementation,
          signUpPOST: async (input) => {
            const response = await originalImplementation.signUp(input);
            if (response.status === 'OK') {
              const { user } = response;
              // Sync with MongoDB
              try {
                await usersCollection.insertOne({
                  _id: new ObjectId(),
                  superTokensId: user.id,
                  email: user.emails[0],
                  createdAt: new Date(),
                });
                console.log('User successfully created in MongoDB');
              } catch (error) {
                console.error('Error syncing with MongoDB:', error);
              }
            }
            return response;
          },
        };
      },
    },
  }),
  Passwordless.init({
    contactMethod: 'EMAIL_OR_PHONE',
    flowType: 'USER_INPUT_CODE_AND_MAGIC_LINK',
  }),
  ThirdParty.init({
    signInAndUpFeature: {
      providers: [
        {
          config: {
            thirdPartyId: 'google',
            clients: [
              {
                clientId:
                  '1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com',
                clientSecret: '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',
              },
            ],
          },
        },
        {
          config: {
            thirdPartyId: 'github',
            clients: [
              {
                clientId: '467101b197249757c71f',
                clientSecret: 'e97051221f4b6426e8fe8d51486396703012f5bd',
              },
            ],
          },
        },
        {
          config: {
            thirdPartyId: 'apple',
            clients: [
              {
                clientId: '4398792-io.supertokens.example.service',
                additionalConfig: {
                  keyId: '7M48Y4RYDL',
                  privateKey:
                    '-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgu8gXs+XYkqXD6Ala9Sf/iJXzhbwcoG5dMh1OonpdJUmgCgYIKoZIzj0DAQehRANCAASfrvlFbFCYqn3I2zeknYXLwtH30JuOKestDbSfZYxZNMqhF/OzdZFTV0zc5u5s3eN+oCWbnvl0hM+9IW0UlkdA\n-----END PRIVATE KEY-----',
                  teamId: 'YWQCXGJRJL',
                },
              },
            ],
          },
        },
        {
          config: {
            thirdPartyId: 'twitter',
            clients: [
              {
                clientId: '4398792-WXpqVXRiazdRMGNJdEZIa3RVQXc6MTpjaQ',
                clientSecret:
                  'BivMbtwmcygbRLNQ0zk45yxvW246tnYnTFFq-LH39NwZMxFpdC',
              },
            ],
          },
        },
      ],
    },
    override: {
      functions: (originalImplementation) => {
        return {
          ...originalImplementation,
          signInUp: async (input) => {
            const response = await originalImplementation.signInUp(input);
            if (response.status === 'OK') {
              const { user } = response;

              console.log("USSSSSSSERRRRRRRR",user)
              try {
                const userExists = await usersCollection.findOne({
                  superTokensId: user.id,
                });
                if (!userExists) {
                  await usersCollection.insertOne({
                    _id: new ObjectId(),
                    superTokensId: user.id,
                    email: user.emails[0],
                    createdAt: new Date(),
                  });
                  console.log('User successfully created in MongoDB');
                }
              } catch (error) {
                console.error('Error syncing with MongoDB:', error);
              }
            }
            return response;
          },
        };
      },
    },
  }),
  Session.init(),
  Dashboard.init(),
  UserRoles.init(),
];

// Cleanup function for MongoDB connection
const cleanup = async () => {
  await client.close();
};
process.on('exit', cleanup);
process.on('SIGINT', cleanup);
