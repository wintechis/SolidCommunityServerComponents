import { getLoggerFor } from '../../logging/LogUtil';
import type { ResourceStore } from '../../storage/ResourceStore';
import { NotImplementedHttpError } from '../../util/errors/NotImplementedHttpError';
import { CreatedResponseDescription } from '../output/response/CreatedResponseDescription';
import type { ResponseDescription } from '../output/response/ResponseDescription';
import type { OperationHandlerInput } from './OperationHandler';
import { OperationHandler } from './OperationHandler';

const fs = require('fs');
const path = require('path');
const parser = require('rocketrml');


const folderPath = path.join(__dirname, '../../../test_folder');

const doMapping = async (inputFiles: any) => {
  const options = {
    toRDF: true,
    verbose: true,
    xmlPerformanceMode: false,
    replace: false,
  };

  const mappingPath = path.join(folderPath, "mappings.ttl")
  
  const resultPath = path.join(folderPath, "out.n3")



  fs.readFile(mappingPath, 'utf8', async (err: any, data: any) => {
    if (err) {
        console.error('Error reading the file', err);
        return;
    }
    let mapfile: any;
    mapfile = data;

    
  console.log(mapfile)

  const result = await parser.parseFileLive(mapfile, inputFiles, options);


  // Save JSON string to file
  fs.writeFile(resultPath, result, (err: any) => {
    if (err) {
      console.error('Error writing file', err);
    } else {
      console.log('Successfully wrote file');
    }
  });
//  const result = await parser.parseFile(mappingPath, resultPath, options).catch((err: any) => { console.log(err); });
  console.log(result);
  });
};

/**
 * Converts incoming {@link HttpRequest} to a Representation without any further parsing.
 */
export class PostMapOperationHandler extends OperationHandler {
  protected readonly logger = getLoggerFor(this);

  private readonly store: ResourceStore;

  public constructor(store: ResourceStore) {
    super();
    this.store = store;
  }

  public async canHandle({ operation }: OperationHandlerInput): Promise<void> {
    if (operation.method !== 'POST') {
      throw new NotImplementedHttpError('This handler only supports POST operations');
    }
  }
  // Note that the only reason this is a union is in case the body is empty.
  // If this check gets moved away from the BodyParsers this union could be removed
  
  public async handle({ operation }: OperationHandlerInput): Promise<ResponseDescription> {
    const {
      'target': target,
      'body': body,
      
    } = operation;
    let decoder = new TextDecoder("utf-8")
    const contentType = body.metadata.contentType;
   // let url = body.url;
    console.log("Hello world");


    const buffer = body.data.read()

    let jsonString = decoder.decode(buffer);
    // Define the path where you want to save the file
    // path.join ensures the path is correct regardless of the OS
    
 







    // While RFC7231 allows treating a body without content type as an octet stream,
    // such an omission likely signals a mistake, so force clients to make this explicit.
    if (contentType == "application/json") {

  
       
    // Some testdata
    const data = {
      name: "John Doe",
      age: 30,
      city: "New York"
    };
      
      
    //target
    if (target.path?.endsWith("/test_folder")) {
        // Convert JavaScript object to JSON string


        let inputFiles = {'mydata': jsonString}
     
      
      doMapping(inputFiles)
    }
   }
   
   return new CreatedResponseDescription(target);
  }
}
