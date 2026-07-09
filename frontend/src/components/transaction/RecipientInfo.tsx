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
      className='group flex flex-row gap-3 border-2 border-border bg-card p-2 rounded-xl justify-start hover:bg-primary hover:border-none' >

      {/** User profile with their name intialisation */}
      <div className='flex h-12 w-12 rounded-full p-2 border border-border font-bold font-gray-600 justify-center items-center bg-secondary text-muted-foreground'>
        {name}
      </div>


      <div className='flex flex-col items-start justify-center group-hover:text-primary-foreground'>
        <h2 className='font-semibold text-xl'>{firstName.toUpperCase()} {lastName.toUpperCase()}</h2>
        <p className='text-muted-foreground font-semibold group-hover:text-primary-foreground'>{email}</p>
      </div>

    </button>
  )
}

export default RecipientInfo;