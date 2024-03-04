import { Component, OnInit } from '@angular/core';
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { IUser, CognitoService } from '../cognito.service';
import { ProfileUpdateService } from './profile-update-service';
import { NgModel } from '@angular/forms';
import { profile } from './profile';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {

  loading: boolean;
  user: IUser;
  profile: profile = {organizationcode:'', username:''};


  constructor(private cognitoService: CognitoService, private profileUpdateService: ProfileUpdateService) {
    this.loading = false;
    this.user = {} as IUser;
  }

  public ngOnInit(): void {
    this.cognitoService.getUser()
    .then((user: any) => {
      this.user = user.attributes;
      console.log(this.user);
    });
  }

  updateDb(org: string, username: string){


    this.user['custom:organization'] = this.user['custom:organization']
    this.profileUpdateService
    .update({organizationcode: org, username: username}).subscribe(
      (res)=>{
        console.log("Success")  
      }
    );
    this.cognitoService.updateUser(this.user);
  }

  public update(): void {
    this.loading = true;
    this.cognitoService.updateUser(this.user)
    .then(() => {
      this.loading = false;
    }).catch(() => {
      this.loading = false;
    });
  }

}