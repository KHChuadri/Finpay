interface RecipientInfoProp {
  email: string,
  firstName: string,
  lastName: string,
  onClick: () => void,
}

const RecipientInfo = ({ email, firstName, lastName, onClick }: RecipientInfoProp) => {
  const name = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`

  return (
    <button

      onClick={() => onClick()}
      className='group flex flex-row gap-3 border-2 border-gray-300 bg-white p-2 rounded-xl justify-start hover:bg-[#C6412A] hover:border-none' >

      {/** User profile with their name intialisation */}
      <div className='flex h-12 w-12 rounded-full p-2 border border-gray-300 font-bold font-gray-600 justify-center items-center bg-gray-200 text-gray-600'>
        {name}
      </div>


      <div className='flex flex-col items-start justify-center group-hover:text-white'>
        <h2 className='font-semibold text-xl'>{firstName.toUpperCase()} {lastName.toUpperCase()}</h2>
        <p className='text-gray-600 font-semibold group-hover:text-white'>{email}</p>
      </div>

    </button>
  )
}

export default RecipientInfo;