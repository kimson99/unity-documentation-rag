import { QueryClient } from '@tanstack/react-query';

// const defaultQueryFn = async ({queryKey}) => {
//   const {data} = await ///
//   return data;
// }

const queryClient = new QueryClient({
  // defaultOptions: {
  //   queries: {
  //     queryFn: defa
  //   }
  // }
});

export default queryClient;
