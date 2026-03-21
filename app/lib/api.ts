import { deviceStorage, init} from "@tma.js/sdk";



export const BASE_URL=process.env.NEXT_PUBLIC_API_URL??"http://localhost:8000";
init()

export let initData:string=""
export const setInitData = (data: string) => {
    initData = data;
  };
export async function refreshToken():Promise<boolean>{
    if (initData==undefined){
        return false
    }

    try{

        const response= await fetch(`${BASE_URL}/auth/telegram`,{
            method:"POST",
            headers:{"Content-Type":"application/json",
                "Authorization": `tma ${initData}`,
            },
        });

        if (!response.ok){
            return false;
        }

        const data:auth=await response.json();


        await deviceStorage.setItem("token",data.token);


        return true

    }catch(err){

        return false

    }
    
}

const handleResponse=async<T>(response:Response):Promise<T>=>{
    if(!response.ok){
      
        const body=await response.text()


        throw new ApiError(response.status,body)
    }
    return response.json() as Promise<T>
}


export const fetchWithRetry=async<T>(url:string,options:RequestInit,retries=2):Promise<T>=>{
    let lastError:ApiError|null=null;


    for(let i=0;i<retries;i++){
        const res=await fetch(`${BASE_URL}${url}`,{
            ...options,
            headers:await getHeaders(initData),
        })

        try{

            return await handleResponse<T>(res)
        }catch(error){
            if (!(error instanceof ApiError)) throw error;
            lastError=error;
            if(!error.isUnauthorized) throw error;

            const refreshed=await refreshToken();

            if (!refreshed) throw error;

        }

        
    }
    throw lastError!;

}





async function getHeaders(initData?:string): Promise<HeadersInit> {
    let  token = await  deviceStorage.getItem("token")

    // let token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoie1wiaWRcIjo4MjgzMDY1Mzc4LFwiZmlyc3RfbmFtZVwiOlwiTWFub2pcIixcImxhc3RfbmFtZVwiOlwiU2tcIixcInVzZXJfbmFtZVwiOm51bGx9IiwiZXhwIjoxNzczNjQ0MjA1LCJpYXQiOjE3NzM1NTc4MDV9.QqtS-NTY6krCF6zCtRZ3uySUYvvzuBkNU58lInzIcxk"
    if (token===null){
        let sucess
        if (initData){
            sucess= await refreshToken()
        }
       
       if (sucess){
        token= await deviceStorage.getItem("token")
       }
    }    
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

export const get= async <T> (url:string):Promise<T>=> {
   return fetchWithRetry<T>(url,{method:"GET"})
}

export const post =async<TBody,TResponse>(url:string,body:TBody):Promise<TResponse>=>{
    return  fetchWithRetry(url,{
        method:"POST",
        body:JSON.stringify(body)
    })
    
}