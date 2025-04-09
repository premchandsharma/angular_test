export interface UserAttributes {
    [key: string]: any;
  }
  
  export interface VerifyUserRequest {
    userId: string;
    campaigns: any[];
    attributes?: UserAttributes;
  }