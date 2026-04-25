/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum FileIndexingStatus {
  InProgress = "in-progress",
  Completed = "completed",
  Failed = "failed",
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
}

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface ChatStreamDto {
  messages: string[];
}

export interface MessageTextPartDto {
  /**
   * The type of the message part
   * @example "text"
   */
  type: "text";
  /**
   * The actual text content
   * @example "Here is the information you requested..."
   */
  text: string;
}

export interface ChatMessageDto {
  /**
   * @format uuid
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;
  /**
   * The role of the message author
   * @example "assistant"
   */
  role: "system" | "user" | "assistant" | "data" | "tool";
  /** Array of message parts (required by AI SDK v5+) */
  parts: MessageTextPartDto[];
  /**
   * @format date-time
   * @example "2026-04-19T10:30:00Z"
   */
  createdAt: string;
}

export interface GetMessagesBySessionIdResponseDto {
  messages: ChatMessageDto[];
  total: number;
}

export interface ChatSessionDto {
  id: string;
  title: string;
  /** @format date-time */
  createdAt: string;
}

export interface GetChatSessionsResponseDto {
  sessions: ChatSessionDto[];
  total: number;
}

export interface FileDto {
  id: string;
  key: string;
  filename: string;
}

export interface FileUploadResponseDto {
  files: FileDto[];
}

export interface IndexDocumentsDto {
  /** Array of file IDs to be indexed */
  fileIds: string[];
}

export interface IndexDocumentResponseDto {
  /** Document indexing job ID */
  documentIndexingId: string;
  fileIds: string[];
}

export interface DocumentIndexingDto {
  id: string;
  fileCount: number;
  /** @format date-time */
  createdAt: string;
}

export interface GetDocumentIndexingsResponseDto {
  documentIndexings: DocumentIndexingDto[];
  total: number;
}

export interface FileIndexingDto {
  id: string;
  file: FileDto;
  status: FileIndexingStatus;
  error: object | null;
  /** @format date-time */
  createdAt: string;
}

export interface GetFileIndexingsResponseDto {
  fileIndexings: FileIndexingDto[];
  total: number;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Unity Documentation RAG API
 * @version 1.0
 * @contact
 *
 * API documentation for Unity Documentation RAG
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerSignIn
     * @request POST:/api/auth/signin
     */
    authControllerSignIn: (data: LoginDto, params: RequestParams = {}) =>
      this.request<LoginResponseDto, any>({
        path: `/api/auth/signin`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerRegister
     * @request POST:/api/auth/register
     */
    authControllerRegister: (data: RegisterDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Health
     * @name HealthControllerCheck
     * @request GET:/api/health
     */
    healthControllerCheck: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "ok" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        },
        {
          /** @example "error" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"redis":{"status":"down","message":"Could not connect"}} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        }
      >({
        path: `/api/health`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Health
     * @name HealthControllerPing
     * @request GET:/api/health/ping
     */
    healthControllerPing: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/health/ping`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UserControllerGetMe
     * @request GET:/api/users/me
     * @secure
     */
    userControllerGetMe: (params: RequestParams = {}) =>
      this.request<UserDto, any>({
        path: `/api/users/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerChat
     * @request POST:/api/chat/stream
     */
    chatControllerChat: (data: ChatStreamDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/chat/stream`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerGetMessagesBySessionId
     * @request GET:/api/chat/sessions/{sessionId}/messages
     */
    chatControllerGetMessagesBySessionId: (
      sessionId: string,
      query: {
        skip: number;
        take: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetMessagesBySessionIdResponseDto, any>({
        path: `/api/chat/sessions/${sessionId}/messages`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags ChatSession
     * @name ChatSessionControllerCreateSession
     * @request POST:/api/chat-session/create
     */
    chatSessionControllerCreateSession: (params: RequestParams = {}) =>
      this.request<ChatSessionDto, any>({
        path: `/api/chat-session/create`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags ChatSession
     * @name ChatSessionControllerGetSessionsByUserId
     * @request GET:/api/chat-session
     */
    chatSessionControllerGetSessionsByUserId: (
      query: {
        take: number;
        skip: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetChatSessionsResponseDto, any>({
        path: `/api/chat-session`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags ChatSession
     * @name ChatSessionControllerGetSessionById
     * @request GET:/api/chat-session/{sessionId}
     */
    chatSessionControllerGetSessionById: (
      sessionId: string,
      params: RequestParams = {},
    ) =>
      this.request<ChatSessionDto, any>({
        path: `/api/chat-session/${sessionId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File
     * @name FileControllerUploadFile
     * @request POST:/api/files/upload
     * @secure
     */
    fileControllerUploadFile: (
      data: {
        files?: File[];
      },
      params: RequestParams = {},
    ) =>
      this.request<FileUploadResponseDto, any>({
        path: `/api/files/upload`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Indexing
     * @name IndexingControllerIndex
     * @request POST:/api/indexing
     * @secure
     */
    indexingControllerIndex: (
      data: IndexDocumentsDto,
      params: RequestParams = {},
    ) =>
      this.request<IndexDocumentResponseDto, any>({
        path: `/api/indexing`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Indexing
     * @name IndexingControllerGetDocumentIndexings
     * @request GET:/api/indexing
     * @secure
     */
    indexingControllerGetDocumentIndexings: (
      query: {
        skip: number;
        take: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetDocumentIndexingsResponseDto, any>({
        path: `/api/indexing`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Indexing
     * @name IndexingControllerGetDocumentIndexing
     * @request GET:/api/indexing/{documentIndexingId}
     * @secure
     */
    indexingControllerGetDocumentIndexing: (
      documentIndexingId: string,
      params: RequestParams = {},
    ) =>
      this.request<DocumentIndexingDto, any>({
        path: `/api/indexing/${documentIndexingId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Indexing
     * @name IndexingControllerGetIndexingFiles
     * @request GET:/api/indexing/{documentIndexingId}/files
     * @secure
     */
    indexingControllerGetIndexingFiles: (
      documentIndexingId: string,
      query: {
        skip: number;
        take: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetFileIndexingsResponseDto, any>({
        path: `/api/indexing/${documentIndexingId}/files`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
