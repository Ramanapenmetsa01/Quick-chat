import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUserCircle } from "react-icons/fa";
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext';

const ProfilePage = () => {
  const { updateProfile, authUser } = useContext(AuthContext)

  const [selectedImg, setSelectedimg] = useState(null)
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName)
  const [bio, setBio] = useState(authUser.bio)

  const handleSubmit = async (e) => {

    e.preventDefault();
    if (!selectedImg) {
      await updateProfile({ fullName: name, bio })
      navigate('/')
      return;
    }
    const reader = new FileReader()
    reader.readAsDataURL(selectedImg);
    reader.onload = async () => {
      const base64Image = reader.result
      await updateProfile({ profilePic: base64Image, fullName: name, bio })
      navigate("/");
      return
    }
  }
  return (
    <div className='min-h-screen bg-over bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-3xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 p-10 flex-1'>
          <h3 className='text-lg'>Profile details</h3>
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input type="file" onChange={e => setSelectedimg(e.target.files[0])} id='avatar' accept='.png, .jpg, .jpeg' hidden />
            {selectedImg instanceof File ? (
              <img
                src={URL.createObjectURL(selectedImg)}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : authUser?.profilePic ? (
              <img
                src={authUser.profilePic}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <FaUserCircle className="w-12 h-12" />
            )}
            Upload Profile image
          </label>
          <input onChange={e => setName(e.target.value)} value={name}
            type="text" required placeholder='Your name' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' />

          <textarea onChange={e => setBio(e.target.value)} value={bio} placeholder='Write profile bio' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none' rows={4}></textarea>

          <button type="submit" className='bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer'>Save</button>

        </form>

        {selectedImg instanceof File ? (
              <img
                src={URL.createObjectURL(selectedImg)}
                className="max-w-56 aspect-square rounded-full mx-10 max-sm:mt-10 object-cover"

              />
            ) : authUser?.profilePic ? (
              <img
                src={authUser.profilePic}
                className="max-w-56 aspect-square rounded-full mx-10 max-sm:mt-10 object-cover"

              />
            ) : (
              <img src={assets.logo_icon} alt="" className='max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10' />
            )}
        
      </div>
    </div>
  )
}

export default ProfilePage
