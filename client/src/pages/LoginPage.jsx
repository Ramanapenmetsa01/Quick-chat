import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { IoChevronBack } from "react-icons/io5";
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up")
   const [isChecked, setIsChecked] = useState(false)
  const [inputDetails, SetInputDetails] = useState({
    fullName: "",
    email: "",
    password: "",
    bio: ""
  })
  const [isNext, setIsNext] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const {login}=useContext(AuthContext)

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple clicks while loading
    if (isLoading) return;
                  
    // validation for required fields
    if (currState === "Sign up" && !isNext) {
      if (!inputDetails.fullName || !inputDetails.email || !inputDetails.password) {
        toast.dismiss();
        toast.error("All fields are required")
        return;
      }
      if(!isChecked){
        toast.dismiss();
        toast.error("Please agree to the terms of use & privacy policy.")
        return;
      }
      if (inputDetails.password.length<8){
        toast.dismiss();
        toast.error("Password should be atleast 8 characters")
        return
      }
      setIsNext(true);
      return
    }
    
    // Check if checkbox is checked before login/signup
    if (!isChecked) {
      toast.dismiss();
      toast.error("Please agree to the terms of use & privacy policy")
      return;
    }
    
    setIsLoading(true)
    try {
      await login(currState=="Sign up"?"signup":"login",inputDetails)
    } catch (error) {
      console.error(error)
    } finally {
        setIsLoading(false)
      
    }
  }

  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
      {/* ----left---- */}
      <img src={assets.logo_big} alt="" className='w-[min(30vw,250px)]' />
      {/* ----Right---- */}

      <form onSubmit={handleSubmit} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'>
        <h2 className='font-medium text-2xl flex justify-between items-center'>{currState}

          {isNext && <IoChevronBack size={24} className="cursor-pointer" onClick={() => setIsNext(false)} />}

        </h2>
        {currState === "Sign up" && !isNext && <input type="text" className='p-2 border border-gray-500 rounded-md focus:outline-none' placeholder='Full Name' required onChange={e => SetInputDetails(prev => ({ ...prev, fullName: e.target.value }))} value={inputDetails.fullName || ""} />}

        {!isNext && <input type="email" className='p-2 border border-gray-500 rounded-md focus:outline-none' placeholder='Email id' required onChange={e => SetInputDetails(prev => ({ ...prev, email: e.target.value }))} value={inputDetails.email || ""} />}

        {!isNext && <input type="password" className='p-2 border border-gray-500 rounded-md focus:outline-none' placeholder='Password' required onChange={e => SetInputDetails(prev => ({ ...prev, password: e.target.value }))} value={inputDetails.password || ""} />}

        {isNext && currState === "Sign up" && <textarea
          rows={4}
          value={inputDetails.bio}
          onChange={e => SetInputDetails(prev => ({ ...prev, bio: e.target.value }))}
          className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
          placeholder='Enter your bio...'></textarea>}


        <button
          type='submit'
          disabled={isLoading}
          className={`py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
          {isLoading ? "Loading..." : currState === "Sign up" ? !isNext ? "Next" : "Create Account" : "Login"}
        </button>

        <div className='flex items-center gap-2 text-sm text-gray-5000'>
          <input type="checkbox" className='cursor-pointer' onClick={(e)=>setIsChecked(e.target.checked)} />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>

          <div className='flex flex-col gap-2'>
            {currState==='Sign up'?(
              <p className='text-sm text-gray-600 cursor-pointer'>Already have an account? <span onClick={()=>{setCurrState("Login"); setIsNext(false)}}className='font-medium text-violet-500 cursor pointer'>Login</span></p>
            ):(
              <p className='text-sm text-gray-600 cursor-pointer'>Create an account <span onClick={()=>setCurrState("Sign up")} className='font-medium text-violet-500 cursor pointer'>Sign up</span></p>
            )}
          </div>

      </form>
    </div>
  )
}

export default LoginPage

