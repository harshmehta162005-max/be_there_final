import { useMutation, useQuery } from "convex/react"
import { set } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const useConvexQuery=(query,...args) => {
    const result=useQuery(query,...args);

    const[data,setData]=useState(null);
    const[isLoading,setIsLoading]=useState(true);
    const [error,setError]=useState(null);
    useEffect(()=>{
        if(result===undefined){
            setIsLoading(true);
        }
        else{
            try {
                setData(result);
                setError(null);
            } catch (error) {
                setError(error);
                toast.error("An error occurred while fetching data.",error);
            }finally{
                setIsLoading(false);    
            }
        }
    },[result]);  
    
    return {data,isLoading,error};
}


export const useConvexMutation=(mutation) => {
    const mutationFn=useMutation(mutation)

    const[data,setData]=useState(null);
    const[isLoading,setIsLoading]=useState(false);
    const [error,setError]=useState(null);
    
    const mutate=async(...args)=>{
        setIsLoading(true);
        setError(null);
        try {
            const result=await mutationFn(...args);
            setData(result);
            return result;
        } catch (error) {
            setError(error);
            toast.error("An error occurred while performing mutation.",error);
        } finally{
            setIsLoading(false);
        }
    }

    return {mutate,data,isLoading,error};

}
