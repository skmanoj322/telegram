class ApiError extends Error{

    constructor(public status:number,public body:string){

        super(`API error ${status}: ${body}`);
    }
    get isUnauthorized():boolean{
        return this.status===401;
    }

    get isValidationError():boolean{
        return this.status===422;
    }
    get isServerError():boolean{
        return this.status>=500;
    }

}