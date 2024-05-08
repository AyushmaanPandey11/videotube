// the functino takes and returns a function hence it is taking fn as an argument and return func as (fn)=> () => {}
const asyncHandler =  (fn) => async (req,res,next) => {
    try
    {
        return await fn(req,res,next);
    }
    catch(err)
    {
        return res.status(err.code||500).json(
            {
                success : false,
                message: err.message
            }
        )
    }
}
export {asyncHandler};