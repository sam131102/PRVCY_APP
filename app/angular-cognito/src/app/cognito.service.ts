import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {Amplify, Auth } from 'aws-amplify';
import { Router } from '@angular/router';
import * as AWS from 'aws-sdk';
import { HttpClient } from '@angular/common/http';
import { SNS } from 'aws-sdk';

import { environment } from '../environments/environment';

Amplify.configure({
  Auth: environment.cognito
});

export interface IUser {
  email: string;
  username: string;
  password: string;
  showPassword: boolean;
  code: string;
  given_name: string;
  family_name: string;
  birthdate: string;
  'custom:account_type': string;
  'custom:organization': string;
  preferred_username: string;
  gender: string;
}

@Injectable({
  providedIn: 'root'
})
export class CognitoService {
  private authenticationSubject: BehaviorSubject<any>;
  private apiUrl = 'http://yourbackend.api'

  constructor(private router: Router, private http: HttpClient) {
    Amplify.configure({
      Auth: environment.cognito
    });
    this.authenticationSubject = new BehaviorSubject<boolean>(false);
   }

   public signIn(user: IUser): Promise<any> {
    return Auth.signIn(user.email, user.password)
    .then(() => {
      this.authenticationSubject.next(true);
    });
  }
  
  public changePreferredUsername(user: IUser): void {
    user.preferred_username = user.username;
    console.log(user.preferred_username);
  }

  public signUp(user: IUser): Promise<any> {
    return Auth.signUp({
      username: user.username,
      password: user.password,
      attributes: {
        email: user.email,
        given_name: user.given_name,
        family_name: user.family_name,
        birthdate: user.birthdate,
        'custom:account_type': user['custom:account_type'],
        'custom:organization': user['custom:organization'],
      }
    })
    .then((signUpResult) => {
      console.log('User confirmed:', signUpResult.userConfirmed);
    })
    .then(()=>{
      this.router.navigate(['/signIn']);
      this.changePreferredUsername(user);
    })
    .catch((error) => {
      console.error('Sign Up Error:', error);
      throw error;
    });   
  }
  
   public confirmSignUp(user: IUser): Promise<any>{
    return Auth.confirmSignUp(user.email, user.code);
   }

   public signOut(): Promise<any>{
    return Auth.signOut().then(()=>{
      this.authenticationSubject.next(false);
    }).then(() => {
      this.router.navigate(['/signIn']);
    }).then(()=>{
      window.location.reload();
    });
   }

   public isAuthenticated(): Promise<boolean> {
    return Auth.currentAuthenticatedUser()
      .then(() => {
        this.authenticationSubject.next(true);
        return true;
      })
      .catch(() => {
        this.authenticationSubject.next(false);
        return false;
      });
  }


   public getUser(): Promise<any>{
    return Auth.currentUserInfo();
   }

   public updateUser(user: IUser): Promise<any>{
    return Auth.currentUserPoolUser().then((cognitoUser: any)=>{
      return Auth.updateUserAttributes(cognitoUser, user);
    })
   }
   
   public getUsername(): Promise<string> {
    return Auth.currentAuthenticatedUser()
      .then(user => user.username)
      .catch(error => {
        console.error('Error getting username:', error);
        throw error;
      });
  }

   public updateUserAttribute(attributeValue: any): Promise<any> {
    return Auth.currentAuthenticatedUser()
      .then((user) => {
        return Auth.updateUserAttributes(user, { "custom:organization": attributeValue });
      })
      .catch((error) => {
        console.error('Error updating user attribute', error);
        throw error;
      });

    }
    public getAccountType(): Promise<string | undefined> {
      return Auth.currentAuthenticatedUser()
        .then(user => {
          const accountType = user.attributes['custom:account_type'];
          return accountType;
        })
        .catch(error => {
          console.error('Error getting account type:', error);
          return undefined;
        });
    }

    public checkS3UserFolder(folderKey: string): Promise<boolean> {
      return new Promise<boolean>((resolve, reject) => {
        const params = {
          Bucket: environment.s3.bucketName,
          Prefix: folderKey
        };
        AWS.config.update({
          accessKeyId: environment.aws.accessKeyId,
          secretAccessKey: environment.aws.secretAccessKey,
          sessionToken: environment.aws.sessionToken,
          region: environment.aws.region
        });
    
        const s3 = new AWS.S3();
        s3.listObjectsV2(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!(data && data.Contents && data.Contents.length > 0));
          }
        });
      });
    }
    
    public checkS3CaptionsFolder(folderKey: string): Promise<boolean> {
      return new Promise<boolean>((resolve, reject) => {
        const params = {
          Bucket: environment.s3.bucketName,
          Prefix: folderKey
        };
        AWS.config.update({
          accessKeyId: environment.aws.accessKeyId,
          secretAccessKey: environment.aws.secretAccessKey,
          sessionToken: environment.aws.sessionToken,
          region: environment.aws.region
        });

        const s3 = new AWS.S3();
        s3.listObjectsV2(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!(data && data.Contents && data.Contents.length > 0));
          }
        });
      });
    }

    public createS3CaptionsFolder(folderKey: string): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const params = {
          Bucket: environment.s3.bucketName,
          Key: folderKey
        };

        AWS.config.update({
          accessKeyId: environment.aws.accessKeyId,
          secretAccessKey: environment.aws.secretAccessKey,
          sessionToken: environment.aws.sessionToken,
          region: environment.aws.region
        });

        const s3 = new AWS.S3();
        s3.putObject(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    public createS3UserFolder(folderKey: string): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const params = {
          Bucket: environment.s3.bucketName,
          Key: folderKey
        };
  
        AWS.config.update({
          accessKeyId: environment.aws.accessKeyId,
          secretAccessKey: environment.aws.secretAccessKey,
          sessionToken: environment.aws.sessionToken,
          region: environment.aws.region
        });
  
        const s3 = new AWS.S3();
        s3.putObject(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
    public getContactListFromS3(): Promise<string[]> {
      return new Promise<string[]>((resolve, reject) => {
        const params = {
          Bucket: environment.s3.bucketName,
          Delimiter: '/'
        };
  
        AWS.config.update({
          accessKeyId: environment.aws.accessKeyId,
          secretAccessKey: environment.aws.secretAccessKey,
          sessionToken: environment.aws.sessionToken,
          region: environment.aws.region
        });
  
        const s3 = new AWS.S3();
        s3.listObjectsV2(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            const usernames = data.CommonPrefixes?.map(prefix => prefix.Prefix?.replace('/', '') || '') || [];
            resolve(usernames);
          }
        });
      });
    }

    public copyVideoToContactFolder(sourceKey: string, destinationFolder: string): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const params = {
          Bucket: environment.s3.bucketName,
          CopySource: `prvcy-storage-ba20e15b50619-staging/${sourceKey}`,
          Key: `${destinationFolder}/${sourceKey.substring(sourceKey.lastIndexOf('/') + 1)}`
        };
    
        AWS.config.update({
          accessKeyId: environment.aws.accessKeyId,
          secretAccessKey: environment.aws.secretAccessKey,
          sessionToken: environment.aws.sessionToken,
          region: environment.aws.region
        });
    
        const s3 = new AWS.S3();
        s3.copyObject(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }   
    public async subscribeUserToSnsTopic(email: string, topicArn: string): Promise<void> {
      try {
        AWS.config.update({
          accessKeyId: environment.aws.accessKeyId,
          secretAccessKey: environment.aws.secretAccessKey,
          sessionToken: environment.aws.sessionToken,
          region: environment.aws.region
        });
    
        const sns = new AWS.SNS();
    
        const params = {
          Protocol: 'email',
          TopicArn: topicArn,
          Endpoint: email,
        };
    
        await sns.subscribe(params).promise();
    
        console.log(`Subscribed ${email} to topic ${topicArn}`);
      } catch (error) {
        console.error('Error subscribing user to SNS topic:', error);
        throw error;
      }
    }    
    sendShareRequest(receiverUsername: string, videoKey: string): Observable<any> {
      const requestBody = {
        receiverUsername,
        videoKey,
      };
      return this.http.post(`http://localhost/api/video_share_requests.php`, requestBody);
    }

    fetchPendingShareRequests(): Observable<any> {
      return this.http.get(`http://localhost/api/video_share_requests.php`);
    }

    respondToShareRequest(requestId: string, action: 'accept' | 'deny'): Observable<any> {
      const requestBody = { requestId, action };
      return this.http.post(`http://localhost/api/video_share_requests.php`, requestBody);
    }

  }   