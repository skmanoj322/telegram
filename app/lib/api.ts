import { deviceStorage} from "@tma.js/sdk";



export const BASE_URL=process.env.NEXT_PUBLIC_API_URL??"http://localhost:8000";


export let initData:string=""
export const setInitData = (data: string) => {
    initData = data;
  };
export async function refreshToken():Promise<boolean>{

    // const initData="query_id=AAEijLVtAwAAACKMtW28vyGc&user=%7B%22id%22%3A8283065378%2C%22first_name%22%3A%22Manoj%22%2C%22last_name%22%3A%22Sk%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FqfwLS-dj04hfGa5iSPrdnRcb8znV7vdGlQidQuo8B_fBfvmNZOELNfFNzmi3r6JX.svg%22%7D&auth_date=1772602505&signature=i5yfAoYyxrwvi1Zh2ctZ_Ar4HHZn1QaFYCWk2Se4Zkz3e0admJRS-5YvmTGGiD4zglthGn7DJoGl8Zalg0STCg&hash=e6cef50295f3698d242f36c43414c7c6061ad63d733e172c209365f6898b2b81"
    if (initData==undefined){
        return false
    }

    try{

        const response= await fetch(`${BASE_URL}/auth/telegram`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(initData)
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