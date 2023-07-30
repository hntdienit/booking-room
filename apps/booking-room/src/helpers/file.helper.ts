export const fileFilter = (args: {
  originalname: string;
  mimetype: string;
}) => {
  const array_of_allowed_files = ['png', 'jpg', 'jpeg'];
  const array_of_allowed_file_types = [
    'image/png',
    'image/jpg',
    'image/jpeg',
  ];
  const file_extension = args.originalname.slice(
    ((args.originalname.lastIndexOf('.') - 1) >>> 0) + 2,
  );
  if (
    !array_of_allowed_files.includes(file_extension) ||
    !array_of_allowed_file_types.includes(args.mimetype)
  ) {
    return false;
  }
  return true;
};
