import { Fragment, useEffect, useRef, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { getFileTypeClassName, isValidFileSelection } from "utils/common";
import { pdfFileDark, trashFull, UploadDark } from "assets/images";
import appConstants from "constant/common";
import useToast from "hooks/useToast";
import {
  uploadMultipleAttachmentFile,
  downloadedAttachmentFile,
  deleteAttachmentFile,
} from "services";
import Spinner from "../spinner/spinner.component";
import PopupModal from "./PopupModal";
const AttachmentUpload = ({
  heading,
  headingSize,
  moduleName,
  referenceId,
  isAccessUpload,
  isAccessDelete,
  fetchAttachmentFile,
  getAttachmentFile,
  cols,
  customStyles,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDownLoading, setIsDownLoading] = useState(false);
  const [showRemoveFieldMsg, setShowRemoveFieldMsg] = useState(false);
  const [isRemoveFile, setIsRemoveFile] = useState(null);
  const isFetchingUploadRef = useRef(false);
  const isFetchingDeleteRef = useRef(false);
  const isFetchingDownloadRef = useRef(false);

  useEffect(() => {
    setFiles(getAttachmentFile);
  }, [getAttachmentFile]);

  const fetchUploadFile = async (paramData) => {
    if (isFetchingUploadRef.current) return; // Prevent multiple calls
    try {
      isFetchingUploadRef.current = true; // Block further fetches
      setIsUploading(true); // Start loading
      const response = uploadMultipleAttachmentFile(paramData);
      response.then((res) => {
        if (res?.status) {
          showToast({
            message: "File Uploaded Successfully",
            variant: "success",
          });
          console.log("paramData", paramData);

          const setParamData = {
            module: moduleName,
            referenceId: referenceId.orderId,
          };
          fetchAttachmentFile(setParamData);
          setIsUploading(false); // Stop loading
        }
      });
    } catch (error) {
      // Handle errors
      showToast({
        message: error,
        variant: "danger",
      });
      setIsUploading(false); // Stop loading
    } finally {
      isFetchingUploadRef.current = false;
    }
  };

  const fetchDeleteAttachmentFile = async (paramData) => {
    if (isFetchingDeleteRef.current) return; // Prevent multiple calls
    try {
      isFetchingDeleteRef.current = true; // Block further fetches
      const response = deleteAttachmentFile(paramData);
      response.then((res) => {
        if (res?.status) {
          showToast({
            message: res.data.message,
            variant: "success",
          });
          const setParamData = {
            module: moduleName,
            referenceId: referenceId.orderId,
          };
          fetchAttachmentFile(setParamData);
        } else {
          showToast({
            message: res.data.message,
            variant: "danger",
          });
        }
      });
    } catch (error) {
      // Handle errors
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
      isFetchingDeleteRef.current = false;
    }
  };

  const fetchDownloadAttachmentFile = async (paramData) => {
    if (isFetchingDownloadRef.current) return; // Prevent multiple calls
    setIsDownLoading(true);
    try {
      isFetchingDownloadRef.current = true; // Block further fetches
      const response = downloadedAttachmentFile(paramData);
      response.then((res) => {
        if (res?.status) {
          showToast({
            message: res.message,
            variant: "success",
          });
          setIsDownLoading(false);
        }
      });
    } catch (error) {
      // Handle errors
      showToast({
        message: error,
        variant: "danger",
      });
      setIsDownLoading(false);
    } finally {
      isFetchingDownloadRef.current = false;
      setIsDownLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const allselectedFiles = [...uploadedFiles, ...droppedFiles];
    setUploadedFiles(allselectedFiles);
    const result = isValidFileSelection(
      allselectedFiles,
      appConstants?.restrictedFileTypes,
      50
    );
    if (!result.isValid) {
      showToast({
        message: result.reason,
        variant: "danger",
        showTime: 5000,
      });
      setUploadedFiles(result.data);
    } else {
      const paraData = {
        files: result.data,
        body: {
          module: moduleName,
          referenceId: referenceId.orderId,
        },
      };
      fetchUploadFile(paraData);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const allselectedFiles = [...uploadedFiles, ...selectedFiles];
    setUploadedFiles(allselectedFiles);
    const result = isValidFileSelection(
      allselectedFiles,
      appConstants?.restrictedFileTypes,
      50
    );
    if (!result.isValid) {
      showToast({
        message: result.reason,
        variant: "danger",
        showTime: 5000,
      });
      setUploadedFiles(result.data);
    } else {
      const paraData = {
        files: result.data,
        body: {
          module: moduleName,
          referenceId: referenceId.orderId,
        },
      };
      fetchUploadFile(paraData);
    }
  };

  const removeAttachment = (file) => {
    const paraData = {
      id: file.attachment_id,
    };
    fetchDeleteAttachmentFile(paraData);
    setShowRemoveFieldMsg(false);
  };
  const downloadAttachment = (file) => {
    const paraData = {
      id: file.attachment_id,
      ...file,
    };
    fetchDownloadAttachmentFile(paraData);
  };

  const closeShowPopup = () => {
    setShowRemoveFieldMsg(false);
  };

  return (
    <Fragment>
      <Col {...cols} className="attachment-container">
        {/*HeadingSize like: s, m, l, xl */}
        {heading?.length > 0 && (
          <h2
            className={`py-2 attachmentHeading size-${
              headingSize ? headingSize : "s"
            }`}
          >
            {heading}
          </h2>
        )}

        {isAccessUpload && (
          <div
            className={`border d-flex justify-content-center gap-2 rounded py-4 text-center align-items-center ${
              isDragging ? "border-primary bg-light" : "border-muted"
            } ${isUploading ? "upload-disbaled" : " "}`}
            onClick={() => fileInputRef.current.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{ cursor: "pointer" }}
          >
            {isUploading && (
              <div className="text-center d-flex justify-content-center w-100">
                <p className="mt-2 mb-0 text-muted uploadHereHeading pe-4 w-80">
                  Uploading...
                </p>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Uploading...</span>
                </div>
              </div>
            )}
            {!isUploading && (
              <>
                <p className="mb-0 text-muted uploadHereHeading">Upload Here</p>
                <img src={UploadDark} alt="UploadDark" />
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </>
            )}
          </div>
        )}

        {files?.length > 0 && (
          <Row className={`mt-3 px-2 pb-2`}>
            {files?.map((file, index) => (
              <Fragment key={index}>
                <div
                  className={`d-flex flex-row align-items-center gap-4 justify-content-between`}
                  style={customStyles}
                >
                  <span
                    className={getFileTypeClassName(file?.file_type)}
                  ></span>
                  <p
                    className={`m-0 p-0 py-2 text-decoration-underline text-truncate w-100 addedAttachmentName${isDownLoading ? "isDownLoading": ""}`}
                    onClick={() => downloadAttachment(file)}
                    title={file?.file_name}
                  >
                    {file?.file_name}
                  </p>
                  {isAccessDelete && (
                    <button
                      className="btn btn-0 border-0 removeAttachment"
                      onClick={() => {
                        setShowRemoveFieldMsg(true);
                        setIsRemoveFile(file);
                      }}
                    >
                      <img
                        className="trashFull-icon"
                        src={trashFull}
                        alt="trash"
                      />
                    </button>
                  )}
                </div>
              </Fragment>
            ))}
          </Row>
        )}
      </Col>
      {showRemoveFieldMsg && (
        <PopupModal
          show={showRemoveFieldMsg}
          onClose={closeShowPopup}
          className={"orderOrionDashboard bg-white rounded-4"}
          width={"40vh"}
        >
          <div>
            <h5 className="text-center">
              {`Are you sure you want to delete the "${isRemoveFile?.file_name}" attachments?`}
            </h5>
            <div className="d-flex flex-row justify-content-center gap-3 mt-4 modalActions">
              <button
                className="btn btn-0 modalDelete_btn px-3"
                onClick={() => removeAttachment(isRemoveFile)}
              >
                Yes
              </button>
              <button
                className="btn btn-0 modalCancel_btn px-3"
                onClick={closeShowPopup}
              >
                No
              </button>
            </div>
          </div>
        </PopupModal>
      )}
    </Fragment>
  );
};

export default AttachmentUpload;
